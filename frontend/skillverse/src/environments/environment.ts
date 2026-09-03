export const environment = {
  production: false,

  // Split per Week 5's microservices architecture — see
  // skillverse/docs/architecture.md. identityApiUrl covers auth, users,
  // profiles, wallets, transactions. marketplaceApiUrl covers skills,
  // bookings, reviews.
  identityApiUrl: 'http://localhost:8001',
  marketplaceApiUrl: 'http://localhost:8002',

  googleClientId: '357218313241-lo9lk0ihiqo7qbb32m2msf3dc4di9dcv.apps.googleusercontent.com',
};
