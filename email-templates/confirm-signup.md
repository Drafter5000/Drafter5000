Available template variables:

{{ .ConfirmationURL }} - The confirmation link
{{ .Email }} - User's email address
{{ .SiteURL }} - Your app URL
{{ .Token }} - The confirmation token (if you need to build custom URLs)
Redirect URL setting:

In Supabase Dashboard → Authentication → URL Configuration, set:

Site URL: https://your-domain.com
Redirect URLs: Add https://your-domain.com/auth/callback
This ensures after email confirmation, users land on your auth callback which will redirect them through the middleware to /subscribe.
