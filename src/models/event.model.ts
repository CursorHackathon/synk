import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description?: string;
  date: Date;
  location?: string;
  emails: string[];
  eventCode: string;
  createdBy: string; // user ID from better-auth
  maxAttendees?: number;
  rsvps: Array<{
    email: string;
    status: 'pending' | 'accepted' | 'declined';
    respondedAt?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [300, 'Location cannot exceed 300 characters']
  },
  emails: [{
    type: String,
    required: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  }],
  eventCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    length: [6, 'Event code must be exactly 6 characters'],
    match: [/^[A-Z0-9]{6}$/, 'Event code must contain only uppercase letters and numbers']
  },
  createdBy: {
    type: String,
    required: [true, 'Creator ID is required']
  },
  maxAttendees: {
    type: Number,
    min: [1, 'Maximum attendees must be at least 1']
  },
  rsvps: [{
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    },
    respondedAt: {
      type: Date
    }
  }]
}, {
  timestamps: true
});

// Indexes for better performance
EventSchema.index({ eventCode: 1 });
EventSchema.index({ createdBy: 1 });
EventSchema.index({ date: 1 });

// Pre-save middleware to generate event code if not provided
EventSchema.pre('save', function(next) {
  if (!this.eventCode) {
    this.eventCode = generateEventCode();
  }
  next();
});

// Method to generate a unique event code
function generateEventCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Static method to find by event code
EventSchema.statics.findByEventCode = function(eventCode: string) {
  return this.findOne({ eventCode: eventCode.toUpperCase() });
};

// Instance method to add RSVP
EventSchema.methods.addRSVP = function(email: string, status: 'accepted' | 'declined') {
  const existingRSVP = this.rsvps.find((rsvp: any) => rsvp.email === email.toLowerCase());
  
  if (existingRSVP) {
    existingRSVP.status = status;
    existingRSVP.respondedAt = new Date();
  } else {
    this.rsvps.push({
      email: email.toLowerCase(),
      status,
      respondedAt: new Date()
    });
  }
  
  return this.save();
};

// Instance method to get RSVP statistics
EventSchema.methods.getRSVPStats = function() {
  const stats = {
    total: this.emails.length,
    pending: 0,
    accepted: 0,
    declined: 0,
    responseRate: 0
  };
  
  this.rsvps.forEach((rsvp: any) => {
    stats[rsvp.status]++;
  });
  
  stats.responseRate = this.rsvps.length > 0 ? 
    Math.round((this.rsvps.length / stats.total) * 100) : 0;
  
  return stats;
};

export const Event = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
export default Event; 