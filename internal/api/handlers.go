// package api

// import (
// 	"fmt"
// 	"net/http"
// 	"strconv"
// 	"time"

// 	"github.com/gin-gonic/gin"
// 	"github.com/google/uuid"
// 	"github.com/samuelarogbonlo/.escrow/backend/internal/blockchain"
// 	"github.com/samuelarogbonlo/.escrow/backend/internal/models"
// 	"github.com/samuelarogbonlo/.escrow/backend/internal/repository"
// 	"gorm.io/gorm"
// )

// // GetEscrows retrieves all escrows for the authenticated user
// func GetEscrows(c *gin.Context) {
// 	// Get the user's address from the JWT claims or request
// 	// For demo purposes, we'll use a hardcoded address
// 	userAddress := "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
	
// 	// Create repository factory
// 	repoFactory := repository.NewGormFactory()
// 	escrowRepo := repoFactory.NewEscrowRepository()
	
// 	// Get blockchain client for additional data
// 	client := blockchain.GetClient()
// 	if client == nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Blockchain client not initialized"})
// 		return
// 	}
	
// 	// Get chain info to verify connection
// 	chainInfo, err := client.GetChainInfo()
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{
// 			"error": fmt.Sprintf("Failed to get blockchain info: %v", err),
// 		})
// 		return
// 	}
	
// 	// Get user's balance
// 	balance, err := client.GetBalance(userAddress)
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{
// 			"error": fmt.Sprintf("Failed to get balance: %v", err),
// 		})
// 		return
// 	}
	
// 	// Get escrows from database
// 	escrows, err := escrowRepo.FindByUser(c.Request.Context(), userAddress)
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{
// 			"error": fmt.Sprintf("Failed to get escrows: %v", err),
// 		})
// 		return
// 	}
	
// 	c.JSON(http.StatusOK, gin.H{
// 		"escrows": escrows,
// 		"balance": balance,
// 		"chain": chainInfo["chain"],
// 		"network": chainInfo["version"],
// 	})
// }

// // GetEscrow retrieves a specific escrow by ID
// func GetEscrow(c *gin.Context) {
// 	escrowIDStr := c.Param("id")
	
// 	// Parse ID or use it as contract ID depending on format
// 	var escrow *models.Escrow
// 	var err error
	
// 	// Create repository factory
// 	repoFactory := repository.NewGormFactory()
// 	escrowRepo := repoFactory.NewEscrowRepository()
// 	milestoneRepo := repoFactory.NewMilestoneRepository()
	
// 	// Try to parse as UUID first (database ID)
// 	escrowID, uuidErr := uuid.Parse(escrowIDStr)
// 	if uuidErr == nil {
// 		// Found a valid UUID, look up by ID
// 		escrow, err = escrowRepo.Find(c.Request.Context(), escrowID)
// 	} else {
// 		// Not a UUID, treat as contract ID
// 		escrow, err = escrowRepo.FindByContractID(c.Request.Context(), escrowIDStr)
// 	}
	
// 	if err != nil {
// 		// If not found in database, try blockchain
// 		client := blockchain.GetClient()
// 		if client == nil {
// 			c.JSON(http.StatusInternalServerError, gin.H{"error": "Blockchain client not initialized"})
// 			return
// 		}
		
// 		// Get escrow details from blockchain
// 		escrowDetails, err := client.GetEscrowDetails(escrowIDStr)
// 		if err != nil {
// 			c.JSON(http.StatusNotFound, gin.H{
// 				"error": fmt.Sprintf("Escrow not found: %v", err),
// 			})
// 			return
// 		}
		
// 		// Create in-memory Escrow model
// 		contractID := escrowIDStr
// 		if contractIDStr, ok := escrowDetails["id"].(string); ok {
// 			contractID = contractIDStr
// 		}
		
// 		escrow = &models.Escrow{
// 			ID:              uuid.New(),
// 			Title:           "Escrow from blockchain",
// 			ContractID:      contractID,
// 			ClientAddress:   escrowDetails["clientAddress"].(string),
// 			ProviderAddress: escrowDetails["providerAddress"].(string),
// 			TotalAmount:     escrowDetails["amount"].(string),
// 			Status:          escrowDetails["status"].(string),
// 			CreatedAt:       time.Unix(escrowDetails["created_at"].(int64), 0),
// 		}
		
// 		// Get milestones from blockchain
// 		blockchainMilestones, err := client.GetMilestones(contractID)
// 		if err == nil && blockchainMilestones != nil {
// 			// Convert blockchain milestones to our model
// 			for _, m := range blockchainMilestones {
// 				milestone := models.Milestone{
// 					ID:          uuid.New(),
// 					EscrowID:    escrow.ID,
// 					Title:       m["title"].(string),
// 					Description: m["description"].(string),
// 					Percentage:  m["percentage"].(float64),
// 					Amount:      m["amount"].(string),
// 					Status:      m["status"].(string),
// 					CreatedAt:   time.Unix(m["created_at"].(int64), 0),
// 				}
				
// 				if completedAt, ok := m["completed_at"].(int64); ok {
// 					milestone.CompletedAt = time.Unix(completedAt, 0)
// 				}
				
// 				if deadlineAt, ok := m["deadline_at"].(int64); ok {
// 					milestone.DeadlineAt = time.Unix(deadlineAt, 0)
// 				}
				
// 				escrow.Milestones = append(escrow.Milestones, milestone)
// 			}
// 		}
// 	} else {
// 		// Found in database, get milestones
// 		milestones, err := milestoneRepo.FindByEscrow(c.Request.Context(), escrow.ID)
// 		if err != nil {
// 			c.JSON(http.StatusInternalServerError, gin.H{
// 				"error": fmt.Sprintf("Failed to get milestones: %v", err),
// 			})
// 			return
// 		}
		
// 		escrow.Milestones = milestones
// 	}
	
// 	c.JSON(http.StatusOK, gin.H{
// 		"escrow": escrow,
// 	})
// }

// // CreateEscrow creates a new escrow
// func CreateEscrow(c *gin.Context) {
// 	var request struct {
// 		Title           string                   `json:"title" binding:"required"`
// 		Description     string                   `json:"description"`
// 		ClientAddress   string                   `json:"clientAddress" binding:"required"`
// 		ProviderAddress string                   `json:"providerAddress" binding:"required"`
// 		TotalAmount     string                   `json:"totalAmount" binding:"required"`
// 		Milestones      []models.MilestoneCreate `json:"milestones" binding:"required,min=1"`
// 		TokenAddress    string                   `json:"tokenAddress" binding:"required"`
// 	}
	
// 	if err := c.ShouldBindJSON(&request); err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
// 		return
// 	}
	
// 	// Validate that milestone percentages add up to 100%
// 	var totalPercentage float64
// 	for _, m := range request.Milestones {
// 		totalPercentage += m.Percentage
// 	}
	
// 	if totalPercentage != 100 {
// 		c.JSON(http.StatusBadRequest, gin.H{
// 			"error": "Milestone percentages must add up to 100%",
// 		})
// 		return
// 	}
	
// 	// Create blockchain escrow first
// 	client := blockchain.GetClient()
// 	if client == nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Blockchain client not initialized"})
// 		return
// 	}
	
// 	// Convert milestones to blockchain format
// 	blockchainMilestones := make([]map[string]interface{}, len(request.Milestones))
// 	for i, m := range request.Milestones {
// 		blockchainMilestones[i] = map[string]interface{}{
// 			"title":       m.Title,
// 			"description": m.Description,
// 			"percentage":  m.Percentage,
// 		}
		
// 		if !m.DeadlineAt.IsZero() {
// 			blockchainMilestones[i]["deadline"] = m.DeadlineAt.Unix()
// 		}
// 	}
	
// 	// Create blockchain escrow
// 	contractID, err := client.CreateEscrow(
// 		request.ClientAddress,
// 		request.ProviderAddress,
// 		request.TotalAmount,
// 		blockchainMilestones,
// 	)
	
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{
// 			"error": fmt.Sprintf("Failed to create blockchain escrow: %v", err),
// 		})
// 		return
// 	}
	
// 	// Create escrow in database using transaction
// 	err = repository.Transaction(c.Request.Context(), func(tx *gorm.DB) error {
// 		// Get repository factory with transaction
// 		factory := repository.WithTransaction(tx, repository.NewGormFactory())
// 		escrowRepo := factory.NewEscrowRepository()
// 		milestoneRepo := factory.NewMilestoneRepository()
		
// 		// Create escrow
// 		escrow := &models.Escrow{
// 			ID:              uuid.New(),
// 			Title:           request.Title,
// 			Description:     request.Description,
// 			ClientAddress:   request.ClientAddress,
// 			ProviderAddress: request.ProviderAddress,
// 			TotalAmount:     request.TotalAmount,
// 			RemainingAmount: request.TotalAmount,
// 			ReleasedAmount:  "0",
// 			Status:          "active",
// 			ContractID:      contractID,
// 			TokenAddress:    request.TokenAddress,
// 		}
		
// 		if err := escrowRepo.Create(c.Request.Context(), escrow); err != nil {
// 			return fmt.Errorf("failed to create escrow: %w", err)
// 		}
		
// 		// Create milestones
// 		for i, m := range request.Milestones {
// 			// Calculate milestone amount based on percentage
// 			totalAmountFloat, _ := strconv.ParseFloat(request.TotalAmount, 64)
// 			amount := totalAmountFloat * (m.Percentage / 100)
			
// 			milestone := &models.Milestone{
// 				ID:          uuid.New(),
// 				EscrowID:    escrow.ID,
// 				Title:       m.Title,
// 				Description: m.Description,
// 				Percentage:  m.Percentage,
// 				Amount:      fmt.Sprintf("%f", amount),
// 				Status:      "pending",
// 			}
			
// 			if !m.DeadlineAt.IsZero() {
// 				milestone.DeadlineAt = m.DeadlineAt
// 			}
			
// 			if err := milestoneRepo.Create(c.Request.Context(), milestone); err != nil {
// 				return fmt.Errorf("failed to create milestone %d: %w", i, err)
// 			}
// 		}
		
// 		return nil
// 	})
	
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{
// 			"error": fmt.Sprintf("Failed to create escrow: %v", err),
// 		})
// 		return
// 	}
	
// 	c.JSON(http.StatusCreated, gin.H{
// 		"message": "Escrow created successfully",
// 		"contractId": contractID,
// 	})
// } 