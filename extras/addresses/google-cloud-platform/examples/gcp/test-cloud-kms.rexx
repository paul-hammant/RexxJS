#!/usr/bin/env rexx
/* Test Cloud KMS (Key Management Service)
 *
 * This script demonstrates Cloud KMS operations:
 *   - Creating key rings and keys
 *   - Encrypting and decrypting data
 *   - Key rotation
 *   - Key versioning
 *
 * Required APIs:
 *   - cloudkms.googleapis.com
 *
 * Required Permissions:
 *   - cloudkms.keyRings.create
 *   - cloudkms.keyRings.list
 *   - cloudkms.cryptoKeys.create
 *   - cloudkms.cryptoKeys.list
 *   - cloudkms.cryptoKeys.get
 *   - cloudkms.cryptoKeyVersions.create
 *   - cloudkms.cryptoKeyVersions.useToEncrypt
 *   - cloudkms.cryptoKeyVersions.useToDecrypt
 *
 * SECURITY NOTE:
 *   KMS keys cannot be deleted, only disabled
 *   Keys are billed even when disabled
 *   Plan your key structure carefully
 */

SAY "=== Cloud KMS Test ==="
SAY ""

/* Configuration */
LET keyring_name = "rexxjs-test-ring-" || WORD(DATE('S'), 1)
LET key_name = "rexxjs-test-key"
LET location = "us-central1"
LET plaintext = "This is secret data that needs encryption!"

SAY "Configuration:"
SAY "  Key ring: " || keyring_name
SAY "  Key name: " || key_name
SAY "  Location: " || location
SAY "  Plaintext: " || plaintext
SAY ""

SAY "⚠️  IMPORTANT:"
SAY "    KMS keys CANNOT be deleted"
SAY "    They can only be disabled or scheduled for destruction"
SAY "    Keys continue to incur charges even when disabled"
SAY "    This is a security feature to prevent accidental data loss"
SAY ""

/* ========================================
 * Step 1: List existing key rings
 * ======================================== */
SAY "Step 1: Listing existing key rings..."
SAY ""

ADDRESS GCP "KMS LIST KEYRINGS location=" || location

IF RC = 0 THEN DO
  SAY "✓ Key rings listed"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to list key rings (RC=" || RC || ")"
  SAY "Note: You may need to enable the Cloud KMS API"
  SAY ""
END

/* ========================================
 * Step 2: Create a key ring
 * ======================================== */
SAY "Step 2: Creating key ring..."
SAY "  Name: " || keyring_name
SAY "  Location: " || location
SAY ""

ADDRESS GCP "KMS CREATE KEYRING name=" || keyring_name || " location=" || location

IF RC = 0 THEN DO
  SAY "✓ Key ring created: " || keyring_name
  SAY ""
  SAY "Key Ring:"
  SAY "  • Container for cryptographic keys"
  SAY "  • Cannot be deleted (only keys can be disabled)"
  SAY "  • Location is permanent (cannot be changed)"
  SAY "  • Organizes keys by purpose or environment"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create key ring (RC=" || RC || ")"
  SAY ""
  SAY "Common reasons:"
  SAY "  • Cloud KMS API not enabled"
  SAY "  • Insufficient permissions"
  SAY "  • Key ring already exists"
  SAY ""
  EXIT RC
END

/* ========================================
 * Step 3: Create a symmetric encryption key
 * ======================================== */
SAY "Step 3: Creating symmetric encryption key..."
SAY "  Key: " || key_name
SAY "  Ring: " || keyring_name
SAY "  Purpose: encryption"
SAY ""

ADDRESS GCP "KMS CREATE KEY keyring=" || keyring_name || " name=" || key_name || " purpose=encryption location=" || location

IF RC = 0 THEN DO
  SAY "✓ Encryption key created: " || key_name
  SAY ""
  SAY "Key Purposes:"
  SAY "  • encryption: Symmetric encryption/decryption (AES-256)"
  SAY "  • asymmetric-encryption: RSA asymmetric encryption"
  SAY "  • asymmetric-signing: Digital signatures"
  SAY "  • mac: Message authentication codes"
  SAY ""
  SAY "This test uses 'encryption' for symmetric operations"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create key"
  SAY "Note: Key ring may still be creating"
  SAY ""
END

/* ========================================
 * Step 4: List keys in the key ring
 * ======================================== */
SAY "Step 4: Listing keys in key ring..."
SAY ""

ADDRESS GCP "KMS LIST KEYS keyring=" || keyring_name || " location=" || location

IF RC = 0 THEN DO
  SAY "✓ Keys listed (should show " || key_name || ")"
  SAY ""
END

/* ========================================
 * Step 5: Encrypt data
 * ======================================== */
SAY "Step 5: Encrypting data..."
SAY "  Plaintext: " || plaintext
SAY ""

ADDRESS GCP "KMS ENCRYPT keyring=" || keyring_name || " key=" || key_name || " plaintext='" || plaintext || "' location=" || location

IF RC = 0 THEN DO
  SAY "✓ Data encrypted successfully"
  SAY ""
  SAY "The output shows base64-encoded ciphertext"
  SAY "This ciphertext can only be decrypted with this key"
  SAY ""

  /* Store ciphertext for decryption test */
  /* In a real script, you'd parse the output to get the ciphertext */
  SAY "Note: In production, extract and store the ciphertext value"
  SAY "      from the output for later decryption"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to encrypt data"
  SAY ""
END

/* ========================================
 * Step 6: Describe the key
 * ======================================== */
SAY "Step 6: Getting key details..."
SAY ""

ADDRESS GCP "KMS DESCRIBE KEY keyring=" || keyring_name || " key=" || key_name || " location=" || location

IF RC = 0 THEN DO
  SAY "✓ Key details retrieved"
  SAY ""
  SAY "Key metadata includes:"
  SAY "  • Primary version (used for encryption)"
  SAY "  • Creation time"
  SAY "  • Purpose and algorithm"
  SAY "  • Rotation schedule (if configured)"
  SAY "  • Protection level (software/HSM)"
  SAY ""
END

/* ========================================
 * Step 7: Rotate the key
 * ======================================== */
SAY "Step 7: Rotating the key (creating new version)..."
SAY ""

ADDRESS GCP "KMS ROTATE KEY keyring=" || keyring_name || " key=" || key_name || " location=" || location

IF RC = 0 THEN DO
  SAY "✓ Key rotated (new version created)"
  SAY ""
  SAY "Key Rotation:"
  SAY "  • Creates a new key version"
  SAY "  • New version becomes primary for encryption"
  SAY "  • Old versions remain for decryption"
  SAY "  • All existing ciphertext remains decryptable"
  SAY ""
  SAY "Best Practice: Rotate encryption keys every 90 days"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to rotate key"
  SAY ""
END

/* ========================================
 * Step 8: List key versions
 * ======================================== */
SAY "Step 8: Checking key versions..."
SAY ""

ADDRESS GCP "KMS DESCRIBE KEY keyring=" || keyring_name || " key=" || key_name || " location=" || location

IF RC = 0 THEN DO
  SAY "✓ Key versions checked"
  SAY ""
  SAY "After rotation, the key should have:"
  SAY "  • Version 1 (original, still enabled)"
  SAY "  • Version 2 (new primary)"
  SAY ""
END

/* ========================================
 * Summary (No cleanup - keys cannot be deleted)
 * ======================================== */
SAY "=== Test Complete ==="
SAY ""
SAY "Summary:"
SAY "  • Created key ring: " || keyring_name
SAY "  • Created encryption key: " || key_name
SAY "  • Encrypted sample data"
SAY "  • Rotated key (created new version)"
SAY ""
SAY "⚠️  CLEANUP NOTE:"
SAY "    KMS keys CANNOT be deleted"
SAY "    The key ring and key created in this test will remain"
SAY "    Keys can be disabled but continue to incur charges"
SAY ""
SAY "    To minimize costs, you can disable the key:"
SAY "    gcloud kms keys versions disable 1 \\"
SAY "      --key=" || key_name || " \\"
SAY "      --keyring=" || keyring_name || " \\"
SAY "      --location=" || location
SAY ""
SAY "Cloud KMS Key Concepts:"
SAY ""
SAY "Key Hierarchy:"
SAY "  Project → Location → KeyRing → Key → KeyVersion"
SAY ""
SAY "  • Project: Your GCP project"
SAY "  • Location: Regional or global (cannot be changed)"
SAY "  • KeyRing: Organizational container (cannot be deleted)"
SAY "  • Key: The cryptographic key (cannot be deleted)"
SAY "  • KeyVersion: Specific version of a key (can be destroyed)"
SAY ""
SAY "Key Purposes:"
SAY ""
SAY "1. ENCRYPT_DECRYPT (symmetric):"
SAY "   • AES-256-GCM encryption"
SAY "   • Same key for encrypt and decrypt"
SAY "   • Fast, suitable for large data"
SAY "   • Use case: Encrypt database fields, files"
SAY ""
SAY "2. ASYMMETRIC_SIGN:"
SAY "   • RSA or EC signatures"
SAY "   • Private key signs, public key verifies"
SAY "   • Use case: Code signing, document authentication"
SAY ""
SAY "3. ASYMMETRIC_DECRYPT:"
SAY "   • RSA encryption"
SAY "   • Public key encrypts, private key decrypts"
SAY "   • Use case: Secure message delivery"
SAY ""
SAY "4. MAC:"
SAY "   • Message authentication codes"
SAY "   • HMAC-SHA256"
SAY "   • Use case: Verify data integrity"
SAY ""
SAY "Protection Levels:"
SAY ""
SAY "SOFTWARE:"
SAY "  • Keys stored in Google's software systems"
SAY "  • $0.06 per key version per month"
SAY "  • 10,000 operations/month free"
SAY "  • $0.03 per 10,000 operations after"
SAY ""
SAY "HSM (Hardware Security Module):"
SAY "  • Keys stored in FIPS 140-2 Level 3 certified HSM"
SAY "  • $1.00 per key version per month"
SAY "  • $0.25 per 10,000 operations"
SAY "  • Required for compliance (PCI DSS, HIPAA)"
SAY ""
SAY "EXTERNAL:"
SAY "  • Keys stored in your external key manager"
SAY "  • Bridge to third-party HSMs"
SAY "  • $2.50 per key per month"
SAY ""
SAY "Key Rotation Strategies:"
SAY ""
SAY "Manual Rotation:"
SAY "  • Use KMS ROTATE KEY command"
SAY "  • Creates new version on demand"
SAY "  • You control timing"
SAY ""
SAY "Automatic Rotation:"
SAY "  • Configure rotation period (90, 180, 365 days)"
SAY "  • GCP creates new versions automatically"
SAY "  • Recommended for production"
SAY "  • Command: gcloud kms keys update --rotation-period=90d"
SAY ""
SAY "Rotation Best Practices:"
SAY "  1. Rotate encryption keys every 90 days"
SAY "  2. Keep old versions enabled for decryption"
SAY "  3. Monitor key usage with Cloud Monitoring"
SAY "  4. Set up alerts for failed decrypt attempts"
SAY "  5. Document key purpose and ownership"
SAY ""
SAY "Common Use Cases:"
SAY ""
SAY "1. Application-Level Encryption:"
SAY "   • Encrypt sensitive DB fields before storage"
SAY "   • Store ciphertext in database"
SAY "   • Decrypt on read"
SAY ""
SAY "2. Envelope Encryption:"
SAY "   • Generate data encryption key (DEK)"
SAY "   • Encrypt data with DEK"
SAY "   • Encrypt DEK with KMS key"
SAY "   • Store encrypted DEK with ciphertext"
SAY "   • Best for large files"
SAY ""
SAY "3. Secret Management:"
SAY "   • Encrypt API keys, passwords"
SAY "   • Store in version control (encrypted)"
SAY "   • Decrypt at deployment time"
SAY "   • Note: Consider Secret Manager for this"
SAY ""
SAY "4. Signing and Verification:"
SAY "   • Sign software releases"
SAY "   • Authenticate API requests"
SAY "   • Verify document integrity"
SAY ""
SAY "Integration with GCP Services:"
SAY ""
SAY "  • Compute Engine: Encrypt persistent disks"
SAY "  • Cloud Storage: Customer-managed encryption keys (CMEK)"
SAY "  • BigQuery: Encrypt datasets and tables"
SAY "  • Cloud SQL: Encrypt database instances"
SAY "  • Pub/Sub: Encrypt messages"
SAY "  • Secret Manager: Encrypt secret data"
SAY "  • Kubernetes: Encrypt secrets in GKE"
SAY ""
SAY "Access Control:"
SAY ""
SAY "IAM Roles:"
SAY "  • roles/cloudkms.admin: Full key management"
SAY "  • roles/cloudkms.cryptoKeyEncrypter: Can encrypt only"
SAY "  • roles/cloudkms.cryptoKeyDecrypter: Can decrypt only"
SAY "  • roles/cloudkms.cryptoKeyEncrypterDecrypter: Both"
SAY ""
SAY "Best Practices:"
SAY "  • Separate encrypt and decrypt permissions"
SAY "  • Grant decrypt only to apps that need it"
SAY "  • Use service accounts, not user accounts"
SAY "  • Audit all key operations in Cloud Logging"
SAY ""
SAY "Monitoring and Auditing:"
SAY ""
SAY "Cloud Logging:"
SAY "  • All encrypt/decrypt operations logged"
SAY "  • Admin operations logged"
SAY "  • Filter: resource.type=\"cloudkms_cryptokey\""
SAY ""
SAY "Cloud Monitoring:"
SAY "  • Track request count"
SAY "  • Monitor request latency"
SAY "  • Alert on unusual patterns"
SAY ""
SAY "Key Metrics to Monitor:"
SAY "  • Encrypt request rate"
SAY "  • Decrypt request rate"
SAY "  • Failed requests (possible attack)"
SAY "  • Key version usage"
SAY ""
SAY "Cost Optimization:"
SAY ""
SAY "Tips:"
SAY "  1. Use software protection level unless HSM required"
SAY "  2. Disable unused key versions"
SAY "  3. Schedule key versions for destruction after grace period"
SAY "  4. Cache decrypted data (but refresh periodically)"
SAY "  5. Use envelope encryption for large data"
SAY ""
SAY "Pricing Example:"
SAY "  • 1 key with 2 active versions: $0.12/month (software)"
SAY "  • 100,000 operations: $0.30"
SAY "  • Total: ~$0.42/month"
SAY ""
SAY "Compliance and Certifications:"
SAY ""
SAY "  • FIPS 140-2 Level 3 (HSM keys)"
SAY "  • PCI DSS"
SAY "  • HIPAA"
SAY "  • ISO 27001"
SAY "  • SOC 1/2/3"
SAY ""
SAY "For more information:"
SAY "  https://cloud.google.com/kms/docs"
