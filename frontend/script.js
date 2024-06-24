// Define API endpoints
const baseURL = 'http://localhost:3000/api'; // Update this if your backend server runs on a different port or domain

// Event listener for Gmail authentication button
document.getElementById('gmailAuthButton').addEventListener('click', async () => {
  try {
    const response = await fetch(`${baseURL}/auth/gmail`);
    const data = await response.json();
    window.location.href = data.authUrl; // Redirect user to Google OAuth consent screen
  } catch (error) {
    console.error('Error during Gmail authentication:', error);
    alert('Failed to authenticate with Gmail. Please try again later.');
  }
});


// Event listener for Outlook authentication button
document.getElementById('outlookAuthButton').addEventListener('click', async () => {
  try {
    const response = await fetch(`${baseURL}/auth/outlook`);
    const data = await response.json();
    window.location.href = data.authUrl;
  } catch (error) {
    console.error('Error during Outlook authentication:', error);
    alert('Failed to authenticate with Outlook. Please try again later.');
  }
});

// Event listener for fetching emails button
document.getElementById('fetchEmailsButton').addEventListener('click', async () => {
  try {
    // Fetch emails from backend
    const response = await fetch(`${baseURL}/emails`);
    if (!response.ok) {
      throw new Error('Failed to fetch emails');
    }
    const emails = await response.json();

    // Display emails in a list
    const emailsList = document.getElementById('emailsList');
    emailsList.innerHTML = '';
    emails.forEach(email => {
      const emailItem = document.createElement('div');
      emailItem.classList.add('card', 'mb-3');
      emailItem.innerHTML = `
        <div class="card-body">
          <h5 class="card-title">${email.subject}</h5>
          <p class="card-text">${email.body}</p>
          <p class="card-text"><strong>Category:</strong> ${email.category}</p>
          <p class="card-text"><strong>Reply:</strong> ${email.reply}</p>
        </div>
      `;
      emailsList.appendChild(emailItem);
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    alert('Failed to fetch emails. Please try again later.');
  }
});
