package api

import (
	"github.com/gin-gonic/gin"
	"github.com/samuelarogbonlo/.escrow/backend/internal/middleware"
)

// RegisterRoutes sets up all API routes
func RegisterRoutes(r *gin.Engine) {
	// Health check
	r.GET("/health", HealthCheck)

	// API v1 group
	v1 := r.Group("/api/v1")
	{
		// Public routes
		v1.GET("/escrows", GetEscrows)
		v1.GET("/escrows/:id", GetEscrow)

		// Protected routes
		auth := v1.Group("/")
		auth.Use(middleware.JWTAuth())
		{
			// Escrow routes
			auth.POST("/escrows", CreateEscrow)
			auth.PUT("/escrows/:id", UpdateEscrow)
			auth.DELETE("/escrows/:id", DeleteEscrow)

			// Milestone routes
			auth.GET("/escrows/:id/milestones", GetMilestones)
			auth.POST("/escrows/:id/milestones", CreateMilestone)
			auth.PUT("/escrows/:id/milestones/:milestoneId", UpdateMilestone)
			
			// Milestone evidence routes
			auth.POST("/escrows/:id/milestones/:milestoneId/evidence", AddMilestoneEvidence)
			
			// Milestone confirmation routes
			auth.POST("/escrows/:id/milestones/:milestoneId/confirm", ConfirmMilestoneCompletion)
			
			// Milestone modification routes
			auth.POST("/escrows/:id/milestones/:milestoneId/request-modification", RequestMilestoneModification)
			auth.POST("/escrows/:id/milestones/:milestoneId/approve-modification", ApproveMilestoneModification)
			
			// Release condition routes
			auth.POST("/escrows/:id/milestones/:milestoneId/conditions", AddReleaseCondition)
			auth.POST("/escrows/:id/milestones/:milestoneId/conditions/:conditionId/verify", VerifyReleaseCondition)
			
			// Transaction routes
			auth.POST("/escrows/:id/release", ReleaseEscrow)
			auth.POST("/escrows/:id/cancel", CancelEscrow)
			
			// Dispute routes
			auth.POST("/escrows/:id/dispute", CreateDispute)
			auth.PUT("/escrows/:id/dispute/:disputeId", UpdateDispute)
			
			// Wallet routes
			auth.GET("/wallet/balance", GetWalletBalance)
			auth.POST("/wallet/connect", ConnectWallet)
		}
	}
} 