package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

// Config holds all configuration for the application
type Config struct {
	// Server
	ServerAddress string
	ReadTimeout   time.Duration
	WriteTimeout  time.Duration
	FrontendURL   string

	// Database
	DBHost     string
	DBPort     int
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	// JWT
	JWTSecret     string
	JWTExpiration time.Duration

	// Polkadot
	PolkadotRPCURL      string
	PolkadotKeypairSeed string
	PolkadotNetworkID   uint8

	// Contract
	EscrowContractAddress     string
	EscrowContractConstructor string

	// Logging
	LogLevel  string
	LogFormat string

	// Feature Flags
	EnableCaching    bool
	MaxCacheSizeMB   int
	CacheTTLSeconds  int
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	// Load .env file if it exists
	_ = godotenv.Load()

	cfg := &Config{
		// Server
		ServerAddress: getEnv("SERVER_ADDRESS", ":8080"),
		ReadTimeout:   getEnvAsDuration("READ_TIMEOUT", 10*time.Second),
		WriteTimeout:  getEnvAsDuration("WRITE_TIMEOUT", 10*time.Second),
		FrontendURL:   getEnv("FRONTEND_URL", "http://localhost:3000"),

		// Database
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnvAsInt("DB_PORT", 5432),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"),
		DBName:     getEnv("DB_NAME", "escrow"),
		DBSSLMode:  getEnv("DB_SSL_MODE", "disable"),

		// JWT
		JWTSecret:     getEnv("JWT_SECRET", "top-secret-jwt-key"),
		JWTExpiration: getEnvAsDuration("JWT_EXPIRATION", 24*time.Hour),

		// Polkadot
		PolkadotRPCURL:      getEnv("POLKADOT_RPC_URL", "wss://rpc.polkadot.io"),
		PolkadotKeypairSeed: getEnv("POLKADOT_KEYPAIR_SEED", "//Alice"),
		PolkadotNetworkID:   uint8(getEnvAsInt("POLKADOT_NETWORK_ID", 42)),

		// Contract
		EscrowContractAddress:     getEnv("ESCROW_CONTRACT_ADDRESS", "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"),
		EscrowContractConstructor: getEnv("ESCROW_CONTRACT_CONSTRUCTOR", "new"),

		// Logging
		LogLevel:  getEnv("LOG_LEVEL", "info"),
		LogFormat: getEnv("LOG_FORMAT", "json"),

		// Feature Flags
		EnableCaching:    getEnvAsBool("ENABLE_CACHING", false),
		MaxCacheSizeMB:   getEnvAsInt("MAX_CACHE_SIZE_MB", 100),
		CacheTTLSeconds:  getEnvAsInt("CACHE_TTL_SECONDS", 300),
	}

	// Validate critical configuration
	if cfg.JWTSecret == "top-secret-jwt-key" {
		fmt.Println("WARNING: Using default JWT secret. This is not secure for production.")
	}

	return cfg, nil
}

// getEnv gets an environment variable or returns a default value if not set
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// getEnvAsInt gets an environment variable as an integer or returns a default value if not set
func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if valueStr == "" {
		return defaultValue
	}
	value, err := strconv.Atoi(valueStr)
	if err != nil {
		return defaultValue
	}
	return value
}

// getEnvAsDuration gets an environment variable as a duration or returns a default value if not set
func getEnvAsDuration(key string, defaultValue time.Duration) time.Duration {
	valueStr := getEnv(key, "")
	if valueStr == "" {
		return defaultValue
	}
	value, err := time.ParseDuration(valueStr)
	if err != nil {
		return defaultValue
	}
	return value
}

// getEnvAsBool gets an environment variable as a boolean or returns a default value if not set
func getEnvAsBool(key string, defaultValue bool) bool {
	valueStr := getEnv(key, "")
	if valueStr == "" {
		return defaultValue
	}
	value, err := strconv.ParseBool(valueStr)
	if err != nil {
		return defaultValue
	}
	return value
} 