const express = require('express');
const { google } = require('googleapis');
const msal = require('@azure/msal-node');
const axios = require('axios');
const Bull = require('bull');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const openai = require('openai');
const cors = require('cors');


// Load environment variables from .env file
dotenv.config();

const port = process.env.PORT || 3000; // Use port from environment variable or default to 3000

const app = express();
app.use(cors());
app.use(bodyParser.json());

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openaiClient = new openai.OpenAI(OPENAI_API_KEY);
const emailQueue = new Bull('email-tasks');

let gmailTokens, outlookTokens;

// Google OAuth setup
const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

app.get('/api/auth/gmail', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
    ],
  });
  res.send({ authUrl });
});

app.get('/oauth2callback', (req, res) => {
  const code = req.query.code;
  oauth2Client.getToken(code, (err, tokens) => {
    if (err) {
      console.error('Error getting tokens:', err);
      return res.status(500).send('Error getting tokens');
    }
    gmailTokens = tokens;
    // Redirect to another page or send a response to indicate successful authentication
    res.redirect('/emails'); // Example: redirect to a page where emails are displayed
  });
});


// Outlook OAuth setup
const msalConfig = {
  auth: {
    clientId: process.env.OUTLOOK_CLIENT_ID, // Use environment variable
    authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`, // Use environment variable
    clientSecret: process.env.OUTLOOK_CLIENT_SECRET, // Use environment variable
  },
};
const cca = new msal.ConfidentialClientApplication(msalConfig);

app.get('/api/auth/outlook', async (req, res) => {
  try {
    const authUrl = await cca.getAuthCodeUrl({
      scopes: ['https://graph.microsoft.com/.default'],
      redirectUri: process.env.OUTLOOK_REDIRECT_URI, // Use environment variable
    });
    res.send({ authUrl });
  } catch (error) {
    console.error('Error getting auth code URL for Outlook:', error);
    res.status(500).send('Error getting auth code URL for Outlook');
  }
});

app.get('/api/auth/outlook/callback', async (req, res) => {
  const code = req.query.code;
  try {
    const tokenResponse = await cca.acquireTokenByCode({
      code,
      scopes: ['https://graph.microsoft.com/.default'],
      redirectUri: process.env.OUTLOOK_REDIRECT_URI, // Use environment variable
    });
    outlookTokens = tokenResponse.accessToken;
    res.send('Outlook account connected');
  } catch (error) {
    console.error('Error during Outlook authentication:', error);
    res.status(500).send('Error during Outlook authentication');
  }
});

app.get('/api/emails', async (req, res) => {
  try {
    // Fetch emails from Gmail
    oauth2Client.setCredentials(gmailTokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const gmailRes = await gmail.users.messages.list({ userId: 'me', maxResults: 10 });
    const gmailMessages = gmailRes.data.messages || [];

    // Fetch emails from Outlook
    const outlookRes = await axios.get('https://graph.microsoft.com/v1.0/me/messages', {
      headers: { Authorization: `Bearer ${outlookTokens}` },
    });
    const outlookMessages = outlookRes.data.value || [];

    // Process and categorize emails
    const emails = await Promise.all(
      [...gmailMessages, ...outlookMessages].map(async (message) => {
        const content = message.snippet || message.bodyPreview;
        const response = await openaiClient.createCompletion({
          model: 'text-davinci-003',
          prompt: `Categorize this email: ${content}`,
          max_tokens: 10,
        });
        const category = response.choices[0].text.trim();

        const replyResponse = await openaiClient.createCompletion({
          model: 'text-davinci-003',
          prompt: `Email content: ${content}\nCategory: ${category}\nGenerate a response:`,
          max_tokens: 150,
        });
        const reply = replyResponse.choices[0].text.trim();

        return { id: message.id, subject: message.subject, body: content, category, reply };
      })
    );

    res.send(emails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).send('Error fetching emails');
  }
});

emailQueue.process(async (job) => {
  const { email, category, reply } = job.data;

  // Send Gmail reply
  if (email.provider === 'gmail') {
    try {
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: Buffer.from(reply).toString('base64'),
          threadId: email.id,
        },
      });
      console.log('Gmail reply sent successfully');
    } catch (error) {
      console.error('Error sending Gmail reply:', error);
    }
  }

  // Send Outlook reply
  if (email.provider === 'outlook') {
    try {
      await axios.post(
        `https://graph.microsoft.com/v1.0/me/messages/${email.id}/reply`,
        { message: { body: { content: reply } } },
        { headers: { Authorization: `Bearer ${outlookTokens}` } }
      );
      console.log('Outlook reply sent successfully');
    } catch (error) {
      console.error('Error sending Outlook reply:', error);
    }
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
