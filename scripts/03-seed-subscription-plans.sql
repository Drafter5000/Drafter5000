-- Seed data for subscription plans (matching current hardcoded values)

-- Insert Free Plan
INSERT INTO subscription_plans (id, name, description, price_cents, currency, articles_per_month, stripe_product_id, stripe_price_id, is_active, is_visible, is_highlighted, sort_order, cta_text, cta_type)
VALUES ('free', 'Free', 'Perfect for getting started', 0, 'usd', 2, NULL, NULL, true, true, false, 1, 'Get Started', 'signup')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  articles_per_month = EXCLUDED.articles_per_month,
  is_visible = EXCLUDED.is_visible,
  updated_at = NOW();

-- Insert Pro Plan
INSERT INTO subscription_plans (id, name, description, price_cents, currency, articles_per_month, stripe_product_id, stripe_price_id, is_active, is_visible, is_highlighted, sort_order, cta_text, cta_type)
VALUES ('pro', 'Pro', 'Most popular for creators', 7000, 'usd', 20, NULL, NULL, true, true, true, 2, 'Start Free Trial', 'checkout')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  articles_per_month = EXCLUDED.articles_per_month,
  is_visible = EXCLUDED.is_visible,
  is_highlighted = EXCLUDED.is_highlighted,
  updated_at = NOW();

-- Insert Enterprise Plan
INSERT INTO subscription_plans (id, name, description, price_cents, currency, articles_per_month, stripe_product_id, stripe_price_id, is_active, is_visible, is_highlighted, sort_order, cta_text, cta_type)
VALUES ('enterprise', 'Enterprise', 'For teams and agencies', 29900, 'usd', 100, NULL, NULL, true, true, false, 3, 'Contact Sales', 'email')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  articles_per_month = EXCLUDED.articles_per_month,
  is_visible = EXCLUDED.is_visible,
  updated_at = NOW();

-- Insert Free Plan Features
INSERT INTO plan_features (plan_id, feature_text, sort_order) VALUES
('free', '2 articles per month', 1),
('free', 'Email delivery', 2),
('free', 'AI style learning', 3),
('free', 'Basic scheduling', 4),
('free', 'Email support', 5)
ON CONFLICT DO NOTHING;

-- Insert Pro Plan Features
INSERT INTO plan_features (plan_id, feature_text, sort_order) VALUES
('pro', '20 articles per month', 1),
('pro', 'Priority email delivery', 2),
('pro', 'Advanced AI customization', 3),
('pro', 'Flexible scheduling', 4),
('pro', 'Priority support', 5),
('pro', 'Analytics dashboard', 6),
('pro', 'Custom tone control', 7)
ON CONFLICT DO NOTHING;

-- Insert Enterprise Plan Features
INSERT INTO plan_features (plan_id, feature_text, sort_order) VALUES
('enterprise', '100 articles per month', 1),
('enterprise', 'Instant delivery', 2),
('enterprise', 'White-label option', 3),
('enterprise', 'Team collaboration', 4),
('enterprise', '24/7 dedicated support', 5),
('enterprise', 'Advanced analytics', 6),
('enterprise', 'Custom integrations', 7),
('enterprise', 'SLA guarantee', 8)
ON CONFLICT DO NOTHING;
