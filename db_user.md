CREATE USER 'kyc_user_local'@'localhost' IDENTIFIED BY 'MyPasswordHere1!';

GRANT ALL PRIVILEGES ON smart_vault_local.* TO 'kyc_user_local'@'localhost';

FLUSH PRIVILEGES;

EXIT;