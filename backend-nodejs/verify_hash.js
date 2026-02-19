const bcrypt = require('bcryptjs');

const hash = '$2b$10$rKRVKV7dSgpIXI15eOHhGeWjyIIuKitG5pIlrcxnyR/tGNiAG8qpS';
const password = 'password';

bcrypt.compare(password, hash, function (err, res) {
    if (err) {
        console.error("Error comparing:", err);
    } else {
        console.log(`Password '${password}' matches hash: ${res}`);
    }
});
