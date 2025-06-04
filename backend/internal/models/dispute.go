package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Dispute represents a dispute related to an escrow
type Dispute struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	EscrowID     uuid.UUID `gorm:"type:uuid;not null" json:"escrowId"`
	MilestoneID  uuid.UUID `gorm:"type:uuid" json:"milestoneId"`
	InitiatorAddress string    `gorm:"not null" json:"initiatorAddress"`
	Title        string    `gorm:"not null" json:"title"`
	Description  string    `gorm:"not null" json:"description"`
	Status       string    `gorm:"not null;default:'open'" json:"status"`
	Resolution   string    `json:"resolution"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
	ResolvedAt   time.Time `json:"resolvedAt,omitempty"`
	
	// Relations
	Messages []DisputeMessage `gorm:"foreignKey:DisputeID" json:"messages,omitempty"`
}

// DisputeMessage represents a message in a dispute
type DisputeMessage struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	DisputeID uuid.UUID `gorm:"type:uuid;not null" json:"disputeId"`
	Address   string    `gorm:"not null" json:"address"`
	Message   string    `gorm:"not null" json:"message"`
	CreatedAt time.Time `json:"createdAt"`
}

// BeforeCreate is a GORM hook that runs before creating a new record
func (d *Dispute) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	d.CreatedAt = time.Now()
	d.UpdatedAt = time.Now()
	return nil
}

// BeforeCreate is a GORM hook that runs before creating a new record
func (m *DisputeMessage) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	m.CreatedAt = time.Now()
	return nil
} 