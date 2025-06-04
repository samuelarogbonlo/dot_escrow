# .escrow Backend API

This is the backend API for the .escrow platform, a decentralized escrow service built on Polkadot. It handles the integration between the frontend application and the blockchain smart contracts.

## Architecture

The backend is built using the following technologies:

- **Go** with Gin framework for the API server
- **PostgreSQL** for data persistence
- **Polkadot.js** for blockchain integration
- **JWT** for authentication

The codebase follows a clean architecture pattern with the following components:

- **API Layer**: Handles HTTP requests and responses
- **Service Layer**: Contains business logic
- **Repository Layer**: Handles data access
- **Blockchain Layer**: Manages interaction with smart contracts

## API Endpoints

### Authentication
- `POST /api/v1/auth/register`: Register a new user
- `POST /api/v1/auth/login`: Log in and get a JWT token

### Escrows
- `GET /api/v1/escrows`: List all escrows for the current user
- `GET /api/v1/escrows/:id`: Get details of a specific escrow
- `POST /api/v1/escrows`: Create a new escrow
- `PUT /api/v1/escrows/:id`: Update an escrow
- `DELETE /api/v1/escrows/:id`: Delete an escrow

### Milestones
- `GET /api/v1/escrows/:id/milestones`: List all milestones for an escrow
- `POST /api/v1/escrows/:id/milestones`: Create a new milestone for an escrow
- `PUT /api/v1/escrows/:id/milestones/:milestoneId`: Update a milestone

### Milestone Evidence
- `POST /api/v1/escrows/:id/milestones/:milestoneId/evidence`: Add evidence for a milestone

### Milestone Confirmation
- `POST /api/v1/escrows/:id/milestones/:milestoneId/confirm`: Confirm completion of a milestone

### Milestone Modification
- `POST /api/v1/escrows/:id/milestones/:milestoneId/request-modification`: Request a modification to a milestone
- `POST /api/v1/escrows/:id/milestones/:milestoneId/approve-modification`: Approve a requested modification

### Release Conditions
- `POST /api/v1/escrows/:id/milestones/:milestoneId/conditions`: Add a release condition to a milestone
- `POST /api/v1/escrows/:id/milestones/:milestoneId/conditions/:conditionId/verify`: Verify a release condition

### Transactions
- `POST /api/v1/escrows/:id/release`: Release funds from an escrow
- `POST /api/v1/escrows/:id/cancel`: Cancel an escrow

### Disputes
- `POST /api/v1/escrows/:id/dispute`: Create a dispute for an escrow
- `PUT /api/v1/escrows/:id/dispute/:disputeId`: Update a dispute

### Wallet
- `GET /api/v1/wallet/balance`: Get wallet balance
- `POST /api/v1/wallet/connect`: Connect a wallet

## Setup & Running

### Prerequisites
- Go 1.18+
- PostgreSQL 13+
- Docker (optional)

### Configuration
Configuration is handled through environment variables. Create a `.env` file with the following variables:

```
# Server
SERVER_ADDRESS=:8080
READ_TIMEOUT=10s
WRITE_TIMEOUT=10s
FRONTEND_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=escrow
DB_SSL_MODE=disable

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h

# Polkadot
POLKADOT_RPC_URL=wss://rpc.polkadot.io
```

### Running the Server

#### Without Docker
1. Install dependencies:
   ```
   go mod download
   ```

2. Run the server:
   ```
   go run cmd/main.go
   ```

#### With Docker
1. Build the Docker image:
   ```
   docker build -t escrow-backend .
   ```

2. Run the container:
   ```
   docker run -p 8080:8080 --env-file .env escrow-backend
   ```

## Development

### Project Structure
```
.
├── cmd                 # Application entry points
├── internal            # Internal packages
│   ├── api             # API handlers and routes
│   ├── blockchain      # Blockchain integration
│   ├── config          # Configuration
│   ├── database        # Database connection
│   ├── middleware      # HTTP middleware
│   ├── models          # Data models
│   ├── repository      # Data access
│   └── service         # Business logic
└── go.mod              # Go modules
```

### Adding New Features
1. Define models in `internal/models`
2. Create repository methods in `internal/repository`
3. Implement service logic in `internal/service`
4. Add API handlers in `internal/api/handlers.go`
5. Register routes in `internal/api/routes.go`

## Testing
Run tests with:
```
go test ./...
```

## Blockchain Integration
The backend connects to Polkadot smart contracts using the blockchain client. The interface is defined in `internal/blockchain/client.go`. 