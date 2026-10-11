# Brand assets

Files here go live by committing them under these exact names — no code
change needed.

    public/brand/sfmo-logo.png   the full-colour SFMO logo: favicon and
                                 social share image (square, >=512px)
    public/brand/zelle-qr.png    optional Zelle QR code for (925) 997-8182.
                                 Appears next to the Zelle instructions on the
                                 registration form's receipt. Square PNG,
                                 ~400px; until it exists, nothing shows.

The nav and footer use a pixel-art version of the bridge mark, drawn in code
at `src/components/Logo.tsx`, so it stays crisp at 30px and follows the
light/dark theme.
