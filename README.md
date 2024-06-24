# Email Parser

## How This Website Works

1. **Connection to Your Email Account**:
   - Connects to your Google or Outlook account through Google Gmail API and Microsoft Graph API.
   - Requires necessary permissions to read your emails.

2. **Response to Emails**:
   - Uses OpenAI API to generate responses to emails.

## How to Run This Project

### Backend Setup

1. **Start the Backend**:
   - Run the following command to start the backend server:
     ```bash
     node index.js
     ```

### Frontend Setup

1. **Serve the HTML File**:
   - Use a live server to serve the frontend HTML file.

## Environment Variables

Ensure you have the following environment variables set up:

- `GOOGLE_CLIENT_ID`: Your Google Client ID for OAuth authentication.
- `GOOGLE_CLIENT_SECRET`: Your Google Client Secret for OAuth authentication.
- `GOOGLE_REDIRECT_URI`: Redirect URI for Google OAuth.

- `OPENAI_API_KEY`: API Key for OpenAI API.

- `OUTLOOK_CLIENT_ID`: Your Outlook Client ID for OAuth authentication.
- `OUTLOOK_CLIENT_SECRET`: Your Outlook Client Secret for OAuth authentication.
- `OUTLOOK_REDIRECT_URI`: Redirect URI for Outlook OAuth.
- `TENANT_ID`: Tenant ID for Microsoft Graph API.

## Example `.env` File

Create a `.env` file in the root directory with the following structure:

```dotenv
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=your_google_redirect_uri

OPENAI_API_KEY=your_openai_api_key

OUTLOOK_CLIENT_ID=your_outlook_client_id
OUTLOOK_CLIENT_SECRET=your_outlook_client_secret
OUTLOOK_REDIRECT_URI=your_outlook_redirect_uri
TENANT_ID=your_tenant_id
