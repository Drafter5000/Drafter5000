Available template variables:

{{ .ConfirmationURL }} - The password reset link
{{ .Email }} - User's email address
{{ .SiteURL }} - Your app URL
{{ .Token }} - The reset token (if you need to build custom URLs)

Redirect URL setting:

In Supabase Dashboard → Authentication → URL Configuration, set:

Site URL: https://your-domain.com
Redirect URLs: Add https://your-domain.com/reset-password

This ensures after clicking the reset link, users land on your reset password page where they can set a new password.

To configure this template in Supabase:

1. Go to Supabase Dashboard → Authentication → Email Templates
2. Select "Reset Password" template
3. Paste the contents of reset-password.html into the HTML editor
4. Save changes
