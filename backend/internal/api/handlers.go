package api

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/samuelarogbonlo/.escrow/backend/internal/blockchain"
)

// HealthCheck handles the health check endpoint
func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
	})
}

// GetEscrows retrieves all escrows for the authenticated user
func GetEscrows(c *gin.Context) {
	// Get the user's address from the JWT claims or request
	// For demo purposes, we'll use a hardcoded address
	userAddress := "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
	
	// Get blockchain client
	client := blockchain.GetClient()
	if client == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Blockchain client not initialized"})
		return
	}
	
	// Get chain info to verify connection
	chainInfo, err := client.GetChainInfo()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to get blockchain info: %v", err),
		})
		return
	}
	
	// In a real implementation, we would get escrows from the blockchain
	// For now, return simulated data
	
	// Get balance
	balance, err := client.GetBalance(userAddress)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to get balance: %v", err),
		})
		return
	}
	
	// Simulate escrow data
	escrows := []map[string]interface{}{
		{
			"id": "contract-id-1",
			"title": "Website Redesign",
			"client": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
			"provider": "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
			"amount": "1000000000000000000",
			"status": "active",
			"milestonesCount": 3,
			"createdAt": time.Now().Add(-24 * time.Hour).Unix(),
		},
		{
			"id": "contract-id-2",
			"title": "Mobile App Development",
			"client": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
			"provider": "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y",
			"amount": "2500000000000000000",
			"status": "active",
			"milestonesCount": 5,
			"createdAt": time.Now().Add(-48 * time.Hour).Unix(),
		},
	}
	
	c.JSON(http.StatusOK, gin.H{
		"escrows": escrows,
		"balance": balance,
		"chain": chainInfo["chain"],
		"network": chainInfo["version"],
	})
}

// GetEscrow retrieves a specific escrow by ID
func GetEscrow(c *gin.Context) {
	escrowID := c.Param("id")
	
	// Get blockchain client
	client := blockchain.GetClient()
	if client == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Blockchain client not initialized"})
		return
	}
	
	// Get escrow details from blockchain
	escrowDetails, err := client.GetEscrowDetails(escrowID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to get escrow details: %v", err),
		})
		return
	}
	
	// Get milestones for the escrow
	milestones, err := client.GetMilestones(escrowID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to get escrow milestones: %v", err),
		})
		return
	}
	
	// Add milestones to the response
	escrowDetails["milestones"] = milestones
	
	c.JSON(http.StatusOK, gin.H{
		"escrow": escrowDetails,
	})
}

// CreateEscrow creates a new escrow
func CreateEscrow(c *gin.Context) {
	c.JSON(http.StatusCreated, gin.H{
		"message": "This endpoint will create a new escrow",
	})
}

// UpdateEscrow updates an existing escrow
func UpdateEscrow(c *gin.Context) {
	id := c.Param("id")
	c.JSON(http.StatusOK, gin.H{
		"message": "This endpoint will update the escrow with ID " + id,
	})
}

// DeleteEscrow deletes an escrow
func DeleteEscrow(c *gin.Context) {
	id := c.Param("id")
	c.JSON(http.StatusOK, gin.H{
		"message": "This endpoint will delete the escrow with ID " + id,
	})
}

// GetMilestones retrieves all milestones for a specific escrow
func GetMilestones(c *gin.Context) {
	id := c.Param("id")
	c.JSON(http.StatusOK, gin.H{
		"message": "This endpoint will return all milestones for escrow with ID " + id,
	})
}

// CreateMilestone creates a new milestone for a specific escrow
func CreateMilestone(c *gin.Context) {
	id := c.Param("id")
	c.JSON(http.StatusCreated, gin.H{
		"message": "This endpoint will create a new milestone for escrow with ID " + id,
	})
}

// UpdateMilestone updates an existing milestone
func UpdateMilestone(c *gin.Context) {
	id := c.Param("id")
	milestoneId := c.Param("milestoneId")
	c.JSON(http.StatusOK, gin.H{
		"message": "This endpoint will update milestone " + milestoneId + " for escrow " + id,
	})
}

// ReleaseEscrow releases funds from an escrow
func ReleaseEscrow(c *gin.Context) {
	escrowID := c.Param("id")
	
	// Define request struct with field names that match JSON tag names
	type ReleaseRequest struct {
		// Using lowercase field names to match JSON tags
		// This is unusual in Go but will help debug the validation issue
		milestoneId uint   `json:"milestoneId" binding:"required"`
		amount      string `json:"amount" binding:"required"`
	}
	
	var request ReleaseRequest
	
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Get blockchain client
	client := blockchain.GetClient()
	if client == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Blockchain client not initialized"})
		return
	}
	
	// Call blockchain client to release funds
	err := client.ReleaseFunds(escrowID, request.milestoneId, request.amount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to release funds: %v", err),
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Successfully released funds from escrow",
		"escrowId": escrowID,
		"milestoneId": request.milestoneId,
		"amount": request.amount,
	})
}

// CancelEscrow cancels an escrow
func CancelEscrow(c *gin.Context) {
	id := c.Param("id")
	c.JSON(http.StatusOK, gin.H{
		"message": "This endpoint will cancel the escrow with ID " + id,
	})
}

// CreateDispute creates a new dispute for an escrow
func CreateDispute(c *gin.Context) {
	id := c.Param("id")
	c.JSON(http.StatusCreated, gin.H{
		"message": "This endpoint will create a dispute for escrow with ID " + id,
	})
}

// UpdateDispute updates an existing dispute
func UpdateDispute(c *gin.Context) {
	id := c.Param("id")
	disputeId := c.Param("disputeId")
	c.JSON(http.StatusOK, gin.H{
		"message": "This endpoint will update dispute " + disputeId + " for escrow " + id,
	})
}

// GetWalletBalance retrieves the wallet balance for the authenticated user
func GetWalletBalance(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "This endpoint will return the wallet balance",
	})
}

// ConnectWallet connects a wallet for the authenticated user
func ConnectWallet(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "This endpoint will connect a wallet",
	})
}

// AddReleaseCondition adds a condition for automatic milestone release
func AddReleaseCondition(c *gin.Context) {
	escrowId := c.Param("id")
	milestoneId := c.Param("milestoneId")
	
	// Type will be one of: "third_party", "time_based", "oracle"
	var request struct {
		Type string `json:"type" binding:"required"`
		Data string `json:"data" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Validate the condition type without storing it
	switch request.Type {
	case "third_party", "time_based", "oracle":
		// Valid types
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid condition type"})
		return
	}
	
	c.JSON(http.StatusCreated, gin.H{
		"message": "This endpoint will add a release condition for milestone " + milestoneId + " in escrow " + escrowId,
		"type": request.Type,
		"data": request.Data,
	})
}

// VerifyReleaseCondition verifies a condition for a milestone
func VerifyReleaseCondition(c *gin.Context) {
	escrowId := c.Param("id")
	milestoneId := c.Param("milestoneId")
	conditionId := c.Param("conditionId")
	
	var request struct {
		VerificationData string `json:"verificationData"`
	}
	
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "This endpoint will verify condition " + conditionId + " for milestone " + milestoneId + " in escrow " + escrowId,
	})
}

// RequestMilestoneModification requests a modification to a milestone
func RequestMilestoneModification(c *gin.Context) {
	escrowId := c.Param("id")
	milestoneId := c.Param("milestoneId")
	
	var request struct {
		Title       *string `json:"title"`
		Description *string `json:"description"`
		Deadline    *int64  `json:"deadline"`
	}
	
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Check if at least one field is provided
	if request.Title == nil && request.Description == nil && request.Deadline == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least one field must be modified"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "This endpoint will request modification for milestone " + milestoneId + " in escrow " + escrowId,
	})
}

// ApproveMilestoneModification approves a modification request
func ApproveMilestoneModification(c *gin.Context) {
	escrowId := c.Param("id")
	milestoneId := c.Param("milestoneId")
	
	c.JSON(http.StatusOK, gin.H{
		"message": "This endpoint will approve modification for milestone " + milestoneId + " in escrow " + escrowId,
	})
}

// ConfirmMilestoneCompletion marks a milestone as completed by the provider
func ConfirmMilestoneCompletion(c *gin.Context) {
	escrowId := c.Param("id")
	milestoneId := c.Param("milestoneId")
	
	c.JSON(http.StatusOK, gin.H{
		"message": "This endpoint will confirm completion for milestone " + milestoneId + " in escrow " + escrowId,
	})
}

// AddMilestoneEvidence adds evidence for milestone completion
func AddMilestoneEvidence(c *gin.Context) {
	escrowId := c.Param("id")
	milestoneId := c.Param("milestoneId")
	
	var request struct {
		EvidenceHash string `json:"evidenceHash" binding:"required"`
		EvidenceLink string `json:"evidenceLink"`
	}
	
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "This endpoint will add evidence for milestone " + milestoneId + " in escrow " + escrowId,
	})
} 