// // Milestone represents a payment milestone within an escrow agreement
// type Milestone struct {
// 	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
// 	EscrowID    uuid.UUID `gorm:"type:uuid;not null" json:"escrowId"`
// 	Title       string    `gorm:"not null" json:"title"`
// 	Description string    `json:"description"`
// 	Percentage  float64   `gorm:"not null" json:"percentage"`
// 	Amount      string    `gorm:"not null" json:"amount"`
// 	Status      string    `gorm:"not null;default:'pending'" json:"status"`
// 	CreatedAt   time.Time `json:"createdAt"`
// 	UpdatedAt   time.Time `json:"updatedAt"`
// 	DeadlineAt  time.Time `json:"deadlineAt,omitempty"`
// 	CompletedAt time.Time `json:"completedAt,omitempty"`
	
// 	// Evidence for completion
// 	EvidenceHash    string `json:"evidenceHash,omitempty"`
// 	EvidenceLink    string `json:"evidenceLink,omitempty"`
// 	EvidenceAddedAt time.Time `json:"evidenceAddedAt,omitempty"`
	
// 	// Release conditions
// 	ReleaseConditions []ReleaseCondition `gorm:"foreignKey:MilestoneID" json:"releaseConditions,omitempty"`
	
// 	// Modification tracking
// 	ModificationRequested bool      `gorm:"default:false" json:"modificationRequested"`
// 	ModificationApproved  bool      `gorm:"default:false" json:"modificationApproved"`
// 	ModificationRequestedBy string   `json:"modificationRequestedBy,omitempty"`
// 	ModificationRequestedAt time.Time `json:"modificationRequestedAt,omitempty"`
// }

// // MilestoneCreate is used for creating milestones in API requests
// type MilestoneCreate struct {
// 	Title       string    `json:"title" binding:"required"`
// 	Description string    `json:"description"`
// 	Percentage  float64   `json:"percentage" binding:"required,gt=0,lte=100"`
// 	DeadlineAt  time.Time `json:"deadlineAt,omitempty"`
// }

// // ReleaseCondition defines a condition that must be met for automatic milestone release 