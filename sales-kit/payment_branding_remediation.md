# Cantoni Payment Branding Remediation

## Stato verificato

Data: 2026-06-25.

`sales-kit/payment_branding_review_evidence.json` registra `status=blocked_paypal_not_visible` e `release_ready=false`.

I due Payment Link pubblici aprono Stripe Checkout con merchant `Cantoni Digital Studio` e non mostrano testo `EC8` o `EC8 Platform`, ma PayPal non e selezionabile in Browser reale dopo l'espansione degli altri metodi di pagamento.

## Confine account

- Usare solo l'account Stripe/PayPal operativo di Cantoni Digital Studio.
- Email operativa: `cantonidigitalstudio@gmail.com`.
- Non usare account Excellentia, EC8, EC8 Platform, Mr Collins, Diogomez o personali.
- Non salvare password, token, OTP, cookie, recovery code o sessioni in repository.
- Fermarsi prima di qualsiasi pagamento finale.
- Frase contrattuale del gate: `do not submit the final payment step`.

## Fonti operative Stripe

- PayPal overview: `https://docs.stripe.com/payments/paypal`
- PayPal activation: `https://docs.stripe.com/payments/paypal/activate`
- Payment Links: `https://docs.stripe.com/payment-links`
- Checkout payment methods: `https://docs.stripe.com/payments/checkout/payment-methods`

Sintesi: Stripe gestisce i metodi disponibili da Dashboard e mostra metodi eleggibili in Checkout/Payment Links. Per PayPal, lo sblocco passa da Stripe Dashboard > Payment methods, con attivazione o completamento dell'onboarding PayPal quando l'account e idoneo.

## Remediation path

1. Aprire Stripe Dashboard con l'account Cantoni corretto.
2. Aprire `https://dashboard.stripe.com/settings/payment_methods`.
3. Nella sezione wallet/metodi di pagamento, trovare PayPal.
4. Se PayPal e spento, attivarlo e completare il flusso `Continue to PayPal`.
5. Se PayPal e pending, verificare email PayPal, requisiti PayPal e stato onboarding in Stripe.
6. Se PayPal e collegato a un account sbagliato o con branding non coerente, usare la funzione Stripe per cambiare account PayPal solo dopo conferma esplicita.
7. Non cambiare i Payment Link finche il problema e solo disponibilita PayPal: i link attuali mostrano gia `Cantoni Digital Studio`.
8. Dopo lo sblocco, riaprire entrambi i link pubblici:
   - `https://buy.stripe.com/aFa6oG0TAdf3cOY70zd3i00`
   - `https://buy.stripe.com/8x2eVc6dUfnbg1a2Kjd3i01`
9. In Browser reale, espandere gli altri metodi di pagamento e verificare:
   - Stripe Checkout merchant = `Cantoni Digital Studio`.
   - PayPal e visibile e selezionabile su entrambi i link.
   - Nessun testo `EC8`, `EC8 Platform` o altro brand non correlato appare nel flusso PayPal.
   - Nessun pagamento finale viene inviato.
10. Aggiornare `sales-kit/payment_branding_review_evidence.json` con `all_paypal_selectable=true` e `release_ready=true` solo dopo verifica reale completa.
11. Eseguire `npm run audit:payment-branding` e rimuovere `sales-kit/payment_branding_review.flag` solo quando l'audit e verde.

## Evidenza minima per release

`sales-kit/payment_branding_review_evidence.json` deve provare per entrambi i link:

- `stripe_checkout_merchant` = `Cantoni Digital Studio`
- `stripe_merchant_visible` = `true`
- `paypal_selectable` = `true`
- `unrelated_brand_text_detected` = `false`
- `final_payment_submitted` = `false`
- summary `release_ready=true`

Se anche uno solo di questi punti manca, il flag resta.
