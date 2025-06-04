package middleware

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// RequestID adds a unique request ID to each request
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = uuid.New().String()
		}
		c.Set("RequestID", requestID)
		c.Header("X-Request-ID", requestID)
		c.Next()
	}
}

// Logger logs request details
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()

		// Process request
		c.Next()

		// Log details after request is processed
		endTime := time.Now()
		latency := endTime.Sub(startTime)
		requestID, _ := c.Get("RequestID")

		fmt.Printf("[%s] %s | %3d | %13v | %15s | %s\n",
			endTime.Format("2006/01/02 - 15:04:05"),
			c.Request.Method,
			c.Writer.Status(),
			latency,
			c.ClientIP(),
			requestID,
		)
	}
}

// JWTAuth middleware for JWT authentication
func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// This is just a placeholder for now
		// Will be implemented properly later
		c.Next()
	}
} 