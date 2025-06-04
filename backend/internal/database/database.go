package database

import (
	"fmt"
	"log"

	"github.com/samuelarogbonlo/.escrow/backend/internal/config"
	"github.com/samuelarogbonlo/.escrow/backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Initialize sets up the database connection
func Initialize(cfg *config.Config) error {
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBSSLMode,
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("Connected to database")

	// Run migrations
	err = DB.AutoMigrate(
		&models.Escrow{},
		&models.Milestone{},
		&models.ReleaseCondition{},
		&models.Dispute{},
		&models.DisputeMessage{},
	)
	if err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Println("Database migrations completed")

	return nil
}

// GetDB returns the database instance
func GetDB() *gorm.DB {
	return DB
} 