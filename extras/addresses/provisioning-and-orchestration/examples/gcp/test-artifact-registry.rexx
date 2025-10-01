#!/usr/bin/env rexx
/* Test Artifact Registry
 *
 * This script demonstrates Artifact Registry operations:
 *   - Creating and managing repositories
 *   - Listing container images
 *   - Managing image tags
 *
 * Required APIs:
 *   - artifactregistry.googleapis.com
 *
 * Required Permissions:
 *   - artifactregistry.repositories.create
 *   - artifactregistry.repositories.delete
 *   - artifactregistry.repositories.get
 *   - artifactregistry.repositories.list
 *   - artifactregistry.dockerimages.list
 *   - artifactregistry.tags.list
 *
 * NOTE: This test creates repositories but does not push images
 *       Use 'docker push' to upload container images
 */

SAY "=== Artifact Registry Test ==="
SAY ""

/* Configuration */
LET repo_name = "rexxjs-test-repo-" || WORD(DATE('S'), 1)
LET location = "us-central1"
LET format = "docker"

SAY "Configuration:"
SAY "  Repository: " || repo_name
SAY "  Location: " || location
SAY "  Format: " || format
SAY ""

SAY "About Artifact Registry:"
SAY "  Successor to Container Registry (gcr.io)"
SAY "  Supports Docker, Maven, npm, Python, APT, YUM"
SAY "  Regional repositories for lower latency"
SAY "  Fine-grained IAM permissions"
SAY ""

/* ========================================
 * Step 1: List existing repositories
 * ======================================== */
SAY "Step 1: Listing existing repositories..."
SAY ""

ADDRESS GCP "ARTIFACT-REGISTRY LIST REPOSITORIES location=" || location

IF RC = 0 THEN DO
  SAY "✓ Repositories listed"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to list repositories (RC=" || RC || ")"
  SAY "Note: You may need to enable the Artifact Registry API"
  SAY ""
END

/* ========================================
 * Step 2: Create a Docker repository
 * ======================================== */
SAY "Step 2: Creating Docker repository..."
SAY "  Name: " || repo_name
SAY "  Format: " || format
SAY "  Location: " || location
SAY ""

ADDRESS GCP "ARTIFACT-REGISTRY CREATE REPOSITORY name=" || repo_name || " format=" || format || " location=" || location

IF RC = 0 THEN DO
  SAY "✓ Repository created: " || repo_name
  SAY ""
  SAY "Repository URL:"
  SAY "  " || location || "-docker.pkg.dev/tribal-quasar-473615-a4/" || repo_name
  SAY ""
  SAY "To push an image:"
  SAY "  1. Tag your image:"
  SAY "     docker tag myapp:latest " || location || "-docker.pkg.dev/tribal-quasar-473615-a4/" || repo_name || "/myapp:latest"
  SAY "  2. Configure Docker authentication:"
  SAY "     gcloud auth configure-docker " || location || "-docker.pkg.dev"
  SAY "  3. Push the image:"
  SAY "     docker push " || location || "-docker.pkg.dev/tribal-quasar-473615-a4/" || repo_name || "/myapp:latest"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create repository (RC=" || RC || ")"
  SAY ""
  SAY "Common reasons:"
  SAY "  • Artifact Registry API not enabled"
  SAY "  • Insufficient permissions"
  SAY "  • Repository already exists"
  SAY ""
  EXIT RC
END

/* ========================================
 * Step 3: Describe the repository
 * ======================================== */
SAY "Step 3: Getting repository details..."
SAY ""

ADDRESS GCP "ARTIFACT-REGISTRY DESCRIBE REPOSITORY name=" || repo_name || " location=" || location

IF RC = 0 THEN DO
  SAY "✓ Repository details retrieved"
  SAY ""
  SAY "Details include:"
  SAY "  • Repository name and format"
  SAY "  • Creation time"
  SAY "  • Size and image count"
  SAY "  • Encryption configuration"
  SAY ""
END

/* ========================================
 * Step 4: List images in repository
 * ======================================== */
SAY "Step 4: Listing images in repository..."
SAY ""

ADDRESS GCP "ARTIFACT-REGISTRY LIST IMAGES repository=" || repo_name || " location=" || location

IF RC = 0 THEN DO
  SAY "✓ Images listed (repository is new, so it's empty)"
  SAY ""
  SAY "After pushing images, you would see:"
  SAY "  • Image name"
  SAY "  • Tags (latest, v1.0.0, etc.)"
  SAY "  • Size and layers"
  SAY "  • Upload time"
  SAY "  • Vulnerability scan results"
  SAY ""
END

/* ========================================
 * Step 5: Demonstrate other repository formats
 * ======================================== */
SAY "Step 5: Other repository formats available..."
SAY ""

SAY "Artifact Registry supports multiple formats:"
SAY ""
SAY "Docker (containers):"
SAY "  • CREATE REPOSITORY name=my-containers format=docker"
SAY "  • Push/pull with docker command"
SAY ""
SAY "Maven (Java packages):"
SAY "  • CREATE REPOSITORY name=my-maven format=maven"
SAY "  • Configure pom.xml to use repository"
SAY ""
SAY "npm (JavaScript packages):"
SAY "  • CREATE REPOSITORY name=my-npm format=npm"
SAY "  • Configure .npmrc to use repository"
SAY ""
SAY "Python (pip packages):"
SAY "  • CREATE REPOSITORY name=my-python format=python"
SAY "  • Configure pip.conf to use repository"
SAY ""
SAY "APT (Debian packages):"
SAY "  • CREATE REPOSITORY name=my-apt format=apt"
SAY "  • Configure sources.list to use repository"
SAY ""
SAY "YUM (RPM packages):"
SAY "  • CREATE REPOSITORY name=my-yum format=yum"
SAY "  • Configure yum.conf to use repository"
SAY ""

/* ========================================
 * Step 6: Cleanup - Delete the repository
 * ======================================== */
SAY "Step 6: Cleaning up - deleting repository..."
SAY ""

ADDRESS GCP "ARTIFACT-REGISTRY DELETE REPOSITORY name=" || repo_name || " location=" || location

IF RC = 0 THEN DO
  SAY "✓ Repository deleted: " || repo_name
  SAY ""
END
ELSE DO
  SAY "✗ Failed to delete repository"
  SAY "⚠️  Manual cleanup may be required:"
  SAY "    gcloud artifacts repositories delete " || repo_name || " --location=" || location
  SAY ""
END

/* ========================================
 * Summary
 * ======================================== */
SAY "=== Test Complete ==="
SAY ""
SAY "Summary:"
SAY "  • Created Docker repository: " || repo_name
SAY "  • Listed repositories and images"
SAY "  • Deleted repository"
SAY ""
SAY "Artifact Registry Concepts:"
SAY ""
SAY "vs Container Registry (gcr.io):"
SAY "  • Artifact Registry is the successor to Container Registry"
SAY "  • Container Registry will be deprecated"
SAY "  • Artifact Registry supports more formats (not just Docker)"
SAY "  • Better IAM permissions (repository-level)"
SAY "  • Regional endpoints for better performance"
SAY ""
SAY "Repository Naming:"
SAY "  Format: {LOCATION}-{FORMAT}.pkg.dev/{PROJECT}/{REPOSITORY}/{IMAGE}"
SAY "  Example: us-central1-docker.pkg.dev/my-project/my-repo/myapp:v1.0"
SAY ""
SAY "Locations:"
SAY "  • Regional: us-central1, us-east1, europe-west1, asia-east1, etc."
SAY "  • Multi-regional: us, europe, asia"
SAY "  • Best practice: Use regional for lower latency"
SAY ""
SAY "Authentication:"
SAY ""
SAY "1. For Docker:"
SAY "   gcloud auth configure-docker {LOCATION}-docker.pkg.dev"
SAY "   # Configures Docker credential helper"
SAY ""
SAY "2. For CI/CD (Service Account):"
SAY "   • Create service account key"
SAY "   • Grant artifactregistry.writer role"
SAY "   • Use key with docker login:"
SAY "     cat key.json | docker login -u _json_key --password-stdin https://{LOCATION}-docker.pkg.dev"
SAY ""
SAY "3. For Workload Identity (GKE):"
SAY "   • Bind Kubernetes SA to Google SA"
SAY "   • No keys needed!"
SAY ""
SAY "Vulnerability Scanning:"
SAY ""
SAY "  • Automatic scanning of container images"
SAY "  • On-demand and continuous scanning"
SAY "  • Integration with Binary Authorization"
SAY "  • View results:"
SAY "    gcloud artifacts docker images list \\"
SAY "      {LOCATION}-docker.pkg.dev/{PROJECT}/{REPO} \\"
SAY "      --show-occurrences"
SAY ""
SAY "IAM Permissions:"
SAY ""
SAY "Common Roles:"
SAY "  • artifactregistry.reader - Pull images"
SAY "  • artifactregistry.writer - Push images"
SAY "  • artifactregistry.repoAdmin - Manage repository"
SAY ""
SAY "Best Practices:"
SAY "  • Separate repos for dev/staging/prod"
SAY "  • Use service accounts for CI/CD"
SAY "  • Enable vulnerability scanning"
SAY "  • Tag images with semantic versions"
SAY "  • Use immutable tags for releases"
SAY ""
SAY "Image Cleanup:"
SAY ""
SAY "Delete old images:"
SAY "  ARTIFACT-REGISTRY DELETE IMAGE \\"
SAY "    repository=my-repo \\"
SAY "    image=myapp \\"
SAY "    tag=old-version"
SAY ""
SAY "Retention policies:"
SAY "  • Delete untagged images after N days"
SAY "  • Keep last N versions"
SAY "  • Configure via gcloud or Console"
SAY ""
SAY "Integration Patterns:"
SAY ""
SAY "1. Cloud Build → Artifact Registry:"
SAY "   steps:"
SAY "   - name: gcr.io/cloud-builders/docker"
SAY "     args: ['build', '-t', '${_IMAGE}', '.']"
SAY "   - name: gcr.io/cloud-builders/docker"
SAY "     args: ['push', '${_IMAGE}']"
SAY ""
SAY "2. GKE → Artifact Registry:"
SAY "   • Use Workload Identity (no keys!)"
SAY "   • Grant GKE SA the artifactregistry.reader role"
SAY "   • Deploy with image from Artifact Registry"
SAY ""
SAY "3. Cloud Run → Artifact Registry:"
SAY "   gcloud run deploy myapp \\"
SAY "     --image {LOCATION}-docker.pkg.dev/{PROJECT}/{REPO}/myapp:latest"
SAY ""
SAY "Pricing:"
SAY ""
SAY "  • Storage: $0.10 per GB per month"
SAY "  • Network egress:"
SAY "    - Same region: Free"
SAY "    - Cross-region: Standard rates"
SAY "    - Internet: $0.12-$0.23 per GB"
SAY ""
SAY "Cost optimization:"
SAY "  • Delete old/unused images"
SAY "  • Use regional repos (avoid cross-region)"
SAY "  • Compress layers (smaller images)"
SAY "  • Use multi-stage builds"
SAY ""
SAY "For more information:"
SAY "  https://cloud.google.com/artifact-registry/docs"
