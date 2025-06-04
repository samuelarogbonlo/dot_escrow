package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ReleaseConditionType represents the type of release condition
type ReleaseConditionType string

const (
	// ThirdPartyVerificationType requires a trusted third party to verify
	ThirdPartyVerificationType ReleaseConditionType = "third_party"
	// TimeBasedReleaseType automatically releases at a specific time
	TimeBasedReleaseType ReleaseConditionType = "time_based"
	// OracleVerificationType requires data from an external source
	OracleVerificationType ReleaseConditionType = "oracle"
)

// Milestone represents a payment milestone within an escrow agreement
type Milestone struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	EscrowID    uuid.UUID `gorm:"type:uuid;not null" json:"escrowId"`
	Title       string    `gorm:"not null" json:"title"`
	Description string    `json:"description"`
	Percentage  float64   `gorm:"not null" json:"percentage"`
	Amount      string    `gorm:"not null" json:"amount"`
	Status      string    `gorm:"not null;default:'pending'" json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	DeadlineAt  time.Time `json:"deadlineAt,omitempty"`
	CompletedAt time.Time `json:"completedAt,omitempty"`
	
	// Evidence for completion
	EvidenceHash    string `json:"evidenceHash,omitempty"`
	EvidenceLink    string `json:"evidenceLink,omitempty"`
	EvidenceAddedAt time.Time `json:"evidenceAddedAt,omitempty"`
	
	// Release conditions
	ReleaseConditions []ReleaseCondition `gorm:"foreignKey:MilestoneID" json:"releaseConditions,omitempty"`
	
	// Modification tracking
	ModificationRequested bool      `gorm:"default:false" json:"modificationRequested"`
	ModificationApproved  bool      `gorm:"default:false" json:"modificationApproved"`
	ModificationRequestedBy string   `json:"modificationRequestedBy,omitempty"`
	ModificationRequestedAt time.Time `json:"modificationRequestedAt,omitempty"`
}

// ReleaseCondition defines a condition that must be met for automatic milestone release
type ReleaseCondition struct {
	ID                uuid.UUID          `gorm:"type:uuid;primaryKey" json:"id"`
	MilestoneID       uuid.UUID          `gorm:"type:uuid;not null" json:"milestoneId"`
	Type              ReleaseConditionType `gorm:"not null" json:"type"`
	ConditionData     string             `gorm:"not null" json:"conditionData"`
	IsMet             bool               `gorm:"default:false" json:"isMet"`
	VerifiedAt        time.Time          `json:"verifiedAt,omitempty"`
	VerifiedBy        string             `json:"verifiedBy,omitempty"`
	CreatedAt         time.Time          `json:"createdAt"`
}

// BeforeCreate is a GORM hook that runs before creating a new record
func (m *Milestone) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	m.CreatedAt = time.Now()
	m.UpdatedAt = time.Now()
	return nil
}

// BeforeCreate is a GORM hook that runs before creating a new release condition
func (rc *ReleaseCondition) BeforeCreate(tx *gorm.DB) error {
	if rc.ID == uuid.Nil {
		rc.ID = uuid.New()
	}
	rc.CreatedAt = time.Now()
	return nil
} 