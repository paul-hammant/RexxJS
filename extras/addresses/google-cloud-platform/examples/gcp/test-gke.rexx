#!/usr/bin/env rexx
/* Test GKE (Google Kubernetes Engine)
 *
 * This script demonstrates GKE operations:
 *   - Listing clusters
 *   - Cluster creation (commented - expensive!)
 *   - Getting credentials for kubectl
 *   - Cluster management operations
 *
 * Required APIs:
 *   - container.googleapis.com
 *
 * Required Permissions:
 *   - container.clusters.create
 *   - container.clusters.delete
 *   - container.clusters.get
 *   - container.clusters.list
 *   - container.clusters.update
 *   - container.operations.get
 *
 * ⚠️  COST WARNING:
 *     GKE clusters are expensive!
 *     Standard cluster: ~$75/month minimum (3 e2-medium nodes)
 *     Autopilot cluster: Pay only for running pods
 *     This test script LISTS clusters but does NOT create them
 */

SAY "=== GKE (Google Kubernetes Engine) Test ==="
SAY ""

/* Configuration */
LET cluster_name = "rexxjs-test-cluster-" || WORD(DATE('S'), 1)
LET zone = "us-central1-a"
LET num_nodes = "3"
LET machine_type = "e2-medium"

SAY "Configuration (for demonstration):"
SAY "  Cluster: " || cluster_name
SAY "  Zone: " || zone
SAY "  Nodes: " || num_nodes
SAY "  Machine: " || machine_type
SAY ""

SAY "⚠️  COST WARNING:"
SAY "    Creating a GKE cluster incurs significant charges:"
SAY "    • 3 e2-medium nodes: ~$75/month"
SAY "    • Persistent disks: ~$30/month"
SAY "    • Load balancers: ~$20/month each"
SAY "    • Total: $125+/month for basic cluster"
SAY ""
SAY "    Autopilot mode: Lower cost, pay for pods only"
SAY "    • No node management fees"
SAY "    • Pay only for running workloads"
SAY "    • Recommended for most use cases"
SAY ""

/* ========================================
 * Step 1: List existing GKE clusters
 * ======================================== */
SAY "Step 1: Listing existing GKE clusters..."
SAY ""

ADDRESS GCP "GKE LIST CLUSTERS"

IF RC = 0 THEN DO
  SAY "✓ Clusters listed"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to list clusters (RC=" || RC || ")"
  SAY "Note: You may need to enable the Kubernetes Engine API"
  SAY ""
END

/* ========================================
 * Step 2: Demonstrate cluster creation (NOT EXECUTED)
 * ======================================== */
SAY "Step 2: Cluster creation (demonstration only, NOT executed)..."
SAY ""

SAY "To create a standard cluster:"
SAY "  GKE CREATE CLUSTER name=" || cluster_name || " \\"
SAY "    zone=" || zone || " \\"
SAY "    num-nodes=" || num_nodes || " \\"
SAY "    machine-type=" || machine_type
SAY ""
SAY "This would:"
SAY "  • Create " || num_nodes || " worker nodes"
SAY "  • Set up master control plane (GCP managed)"
SAY "  • Configure networking and firewall rules"
SAY "  • Take 5-10 minutes to complete"
SAY ""

SAY "To create an Autopilot cluster (recommended):"
SAY "  GKE CREATE CLUSTER name=" || cluster_name || "-autopilot \\"
SAY "    zone=" || zone || " \\"
SAY "    autopilot=true"
SAY ""
SAY "Autopilot benefits:"
SAY "  • No node management"
SAY "  • Automatic scaling"
SAY "  • Security best practices enforced"
SAY "  • Pay only for running pods"
SAY ""

SAY "⚠️  Skipping actual cluster creation to avoid costs"
SAY ""

/* ========================================
 * Step 3: Demonstrate get credentials
 * ======================================== */
SAY "Step 3: Getting cluster credentials (if cluster exists)..."
SAY ""

SAY "To configure kubectl for a cluster:"
SAY "  GKE GET CREDENTIALS name=my-cluster zone=" || zone
SAY ""
SAY "This would:"
SAY "  • Update ~/.kube/config"
SAY "  • Set current context to the cluster"
SAY "  • Allow kubectl commands"
SAY ""

/* ========================================
 * Step 4: Demonstrate cluster operations
 * ======================================== */
SAY "Step 4: Cluster management operations..."
SAY ""

SAY "Resize cluster (scale nodes):"
SAY "  GKE RESIZE CLUSTER name=my-cluster num-nodes=5 zone=" || zone
SAY ""

SAY "Upgrade Kubernetes version:"
SAY "  GKE UPGRADE CLUSTER name=my-cluster zone=" || zone
SAY "  # Upgrades to latest stable version"
SAY ""
SAY "  GKE UPGRADE CLUSTER name=my-cluster version=1.28.3 zone=" || zone
SAY "  # Upgrades to specific version"
SAY ""

SAY "Describe cluster:"
SAY "  GKE DESCRIBE CLUSTER name=my-cluster zone=" || zone
SAY "  # Shows full cluster configuration"
SAY ""

SAY "List node pools:"
SAY "  GKE LIST NODE-POOLS cluster=my-cluster zone=" || zone
SAY "  # Shows all node pools in cluster"
SAY ""

/* ========================================
 * Summary
 * ======================================== */
SAY "=== Test Complete ==="
SAY ""
SAY "Summary:"
SAY "  • Listed existing GKE clusters"
SAY "  • Demonstrated cluster creation commands"
SAY "  • Showed cluster management operations"
SAY "  • Did NOT create actual cluster (cost savings)"
SAY ""
SAY "GKE Key Concepts:"
SAY ""
SAY "Cluster Modes:"
SAY ""
SAY "1. Standard Mode:"
SAY "   • You manage node pools"
SAY "   • Full control over node configuration"
SAY "   • Pay for all nodes (even if idle)"
SAY "   • Good for: Predictable workloads, specific node requirements"
SAY ""
SAY "2. Autopilot Mode (Recommended):"
SAY "   • Google manages nodes"
SAY "   • Automatic scaling and upgrades"
SAY "   • Pay only for running pods"
SAY "   • Good for: Most workloads, cost optimization"
SAY ""
SAY "Cluster Architecture:"
SAY ""
SAY "Control Plane (Master):"
SAY "  • API server"
SAY "  • Scheduler"
SAY "  • Controller manager"
SAY "  • etcd (key-value store)"
SAY "  • GCP managed, highly available"
SAY "  • Free in most regions"
SAY ""
SAY "Worker Nodes:"
SAY "  • Run your containers"
SAY "  • kubelet, kube-proxy, container runtime"
SAY "  • You pay for these (Compute Engine VMs)"
SAY ""
SAY "Node Pools:"
SAY "  • Groups of nodes with same configuration"
SAY "  • Can have multiple pools per cluster"
SAY "  • Different machine types per pool"
SAY "  • Example: CPU pool + GPU pool"
SAY ""
SAY "Machine Types:"
SAY ""
SAY "General Purpose:"
SAY "  • e2-micro: 0.25 vCPU, 1GB RAM (~$7/month)"
SAY "  • e2-small: 0.5 vCPU, 2GB RAM (~$14/month)"
SAY "  • e2-medium: 1 vCPU, 4GB RAM (~$25/month)"
SAY "  • e2-standard-2: 2 vCPU, 8GB RAM (~$50/month)"
SAY ""
SAY "Compute Optimized (c2):"
SAY "  • High CPU-to-memory ratio"
SAY "  • Good for compute-intensive workloads"
SAY ""
SAY "Memory Optimized (m2):"
SAY "  • High memory-to-CPU ratio"
SAY "  • Good for in-memory databases, caches"
SAY ""
SAY "GPU-Enabled (a2, g2):"
SAY "  • NVIDIA GPUs attached"
SAY "  • Good for ML/AI workloads"
SAY ""
SAY "Networking:"
SAY ""
SAY "VPC-Native Clusters (Recommended):"
SAY "  • Pods get IPs from VPC"
SAY "  • Better integration with GCP services"
SAY "  • Supports VPC peering"
SAY "  • Required for Private GKE"
SAY ""
SAY "Private Clusters:"
SAY "  • Nodes have no public IPs"
SAY "  • Master accessible only from VPC"
SAY "  • Better security"
SAY "  • Access via Cloud VPN or Interconnect"
SAY ""
SAY "Load Balancing:"
SAY "  • Internal: For internal traffic"
SAY "  • External: For internet traffic"
SAY "  • Types: TCP/UDP, HTTP(S)"
SAY ""
SAY "Workload Management:"
SAY ""
SAY "Deploying Applications:"
SAY "  1. Get cluster credentials:"
SAY "     GKE GET CREDENTIALS name=my-cluster"
SAY "  2. Deploy with kubectl:"
SAY "     kubectl apply -f deployment.yaml"
SAY "  3. Expose with service:"
SAY "     kubectl expose deployment myapp --type=LoadBalancer --port=80"
SAY ""
SAY "Scaling:"
SAY "  • Horizontal Pod Autoscaler (HPA)"
SAY "  • Vertical Pod Autoscaler (VPA)"
SAY "  • Cluster Autoscaler (nodes)"
SAY ""
SAY "Storage:"
SAY "  • Persistent Disks (pd-standard, pd-ssd)"
SAY "  • Filestore (NFS)"
SAY "  • Cloud Storage FUSE"
SAY ""
SAY "Security:"
SAY ""
SAY "Workload Identity (Recommended):"
SAY "  • Kubernetes SA → Google SA mapping"
SAY "  • No service account keys needed"
SAY "  • Fine-grained IAM permissions"
SAY "  • Example:"
SAY "    kubectl annotate sa myapp \\"
SAY "      iam.gke.io/gcp-service-account=myapp@project.iam.gserviceaccount.com"
SAY ""
SAY "Binary Authorization:"
SAY "  • Only deploy signed/verified images"
SAY "  • Enforce security policies"
SAY ""
SAY "Pod Security Policies:"
SAY "  • Control pod permissions"
SAY "  • Prevent privileged containers"
SAY "  • Enforce security standards"
SAY ""
SAY "Monitoring and Logging:"
SAY ""
SAY "Cloud Monitoring:"
SAY "  • Automatic metrics collection"
SAY "  • CPU, memory, disk, network"
SAY "  • Custom metrics via Prometheus"
SAY ""
SAY "Cloud Logging:"
SAY "  • Automatic log collection"
SAY "  • Container logs, system logs"
SAY "  • Searchable and filterable"
SAY ""
SAY "Cloud Trace:"
SAY "  • Distributed tracing"
SAY "  • Latency analysis"
SAY ""
SAY "Best Practices:"
SAY ""
SAY "1. Use Autopilot for most workloads"
SAY "   • Simpler management"
SAY "   • Better cost optimization"
SAY "   • Security by default"
SAY ""
SAY "2. Use Workload Identity"
SAY "   • No service account keys"
SAY "   • Better security"
SAY "   • Easier rotation"
SAY ""
SAY "3. Use Private Clusters"
SAY "   • No public node IPs"
SAY "   • Better security"
SAY "   • Access via VPN/Bastion"
SAY ""
SAY "4. Enable Binary Authorization"
SAY "   • Only deploy verified images"
SAY "   • Prevent supply chain attacks"
SAY ""
SAY "5. Use Resource Quotas"
SAY "   • Prevent resource exhaustion"
SAY "   • Fair resource sharing"
SAY ""
SAY "6. Implement Pod Disruption Budgets"
SAY "   • Ensure availability during updates"
SAY "   • Control voluntary disruptions"
SAY ""
SAY "7. Use Namespaces"
SAY "   • Separate environments"
SAY "   • Better organization"
SAY "   • Resource quotas per namespace"
SAY ""
SAY "Cost Optimization:"
SAY ""
SAY "1. Use Autopilot"
SAY "   • Pay only for running pods"
SAY "   • No idle node charges"
SAY ""
SAY "2. Right-size pods"
SAY "   • Set resource requests accurately"
SAY "   • Use VPA for recommendations"
SAY ""
SAY "3. Use Spot VMs (Preemptible)"
SAY "   • Up to 80% discount"
SAY "   • Good for batch workloads"
SAY "   • Can be terminated anytime"
SAY ""
SAY "4. Use Cluster Autoscaler"
SAY "   • Scale down idle nodes"
SAY "   • Scale up on demand"
SAY ""
SAY "5. Regional vs Zonal"
SAY "   • Zonal: One zone, cheaper"
SAY "   • Regional: Multi-zone HA, more expensive"
SAY "   • Choose based on requirements"
SAY ""
SAY "Typical Monthly Costs:"
SAY ""
SAY "Small Development Cluster:"
SAY "  • 3 e2-small nodes: ~$42"
SAY "  • 100GB SSD: ~$17"
SAY "  • Total: ~$60/month"
SAY ""
SAY "Production Cluster (Standard):"
SAY "  • 3 e2-standard-4 nodes: ~$300"
SAY "  • 500GB SSD: ~$85"
SAY "  • Load Balancer: ~$20"
SAY "  • Total: ~$405/month"
SAY ""
SAY "Production Cluster (Autopilot):"
SAY "  • Pay per pod"
SAY "  • ~30-50% cheaper than Standard"
SAY "  • Varies by workload"
SAY ""
SAY "Common Workflows:"
SAY ""
SAY "1. Create Cluster:"
SAY "   GKE CREATE CLUSTER name=prod autopilot=true"
SAY ""
SAY "2. Deploy Application:"
SAY "   GKE GET CREDENTIALS name=prod"
SAY "   kubectl apply -f k8s/"
SAY ""
SAY "3. Scale Deployment:"
SAY "   kubectl scale deployment myapp --replicas=5"
SAY ""
SAY "4. Update Application:"
SAY "   kubectl set image deployment/myapp myapp=new-image:v2"
SAY ""
SAY "5. Cleanup:"
SAY "   GKE DELETE CLUSTER name=prod"
SAY ""
SAY "For more information:"
SAY "  https://cloud.google.com/kubernetes-engine/docs"
