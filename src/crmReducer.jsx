// contexts/CRMContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { crmAPI } from '../services/api';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  tags: string[];
  lastActivity: Date;
  leadScore: number;
  status: 'active' | 'inactive' | 'prospect';
  avatar?: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Lead {
  id: string;
  contactId: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'lost';
  score: number;
  estimatedValue: number;
  probability: number;
  expectedCloseDate: Date;
  assignedTo: string;
  notes: string;
  activities: Activity[];
  createdAt: Date;
}

interface Deal {
  id: string;
  title: string;
  contactId: string;
  leadId?: string;
  value: number;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  expectedCloseDate: Date;
  actualCloseDate?: Date;
  assignedTo: string;
  description: string;
  activities: Activity[];
  createdAt: Date;
}

interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note';
  title: string;
  description: string;
  contactId?: string;
  leadId?: string;
  dealId?: string;
  assignedTo: string;
  dueDate?: Date;
  completed: boolean;
  createdAt: Date;
}

interface CRMState {
  contacts: Contact[];
  leads: Lead[];
  deals: Deal[];
  activities: Activity[];
  loading: boolean;
  error: string | null;
}

type CRMAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONTACTS'; payload: Contact[] }
  | { type: 'ADD_CONTACT'; payload: Contact }
  | { type: 'UPDATE_CONTACT'; payload: Contact }
  | { type: 'DELETE_CONTACT'; payload: string }
  | { type: 'SET_LEADS'; payload: Lead[] }
  | { type: 'ADD_LEAD'; payload: Lead }
  | { type: 'UPDATE_LEAD'; payload: Lead }
  | { type: 'SET_DEALS'; payload: Deal[] }
  | { type: 'ADD_DEAL'; payload: Deal }
  | { type: 'UPDATE_DEAL'; payload: Deal }
  | { type: 'SET_ACTIVITIES'; payload: Activity[] }
  | { type: 'ADD_ACTIVITY'; payload: Activity };

const initialState: CRMState = {
  contacts: [],
  leads: [],
  deals: [],
  activities: [],
  loading: false,
  error: null,
};

const crmReducer = (state: CRMState, action: CRMAction): CRMState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_CONTACTS':
      return { ...state, contacts: action.payload };
    case 'ADD_CONTACT':
      return { ...state, contacts: [action.payload, ...state.contacts] };
    case 'UPDATE_CONTACT':
      return {
        ...state,
        contacts: state.contacts.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'DELETE_CONTACT':
      return {
        ...state,
        contacts: state.contacts.filter(c => c.id !== action.payload),
      };
    case 'SET_LEADS':
      return { ...state, leads: action.payload };
    case 'ADD_LEAD':
      return { ...state, leads: [action.payload, ...state.leads] };
    case 'UPDATE_LEAD':
      return {
        ...state,
        leads: state.leads.map(l =>
          l.id === action.payload.id ? action.payload : l
        ),
      };
    case 'SET_DEALS':
      return { ...state, deals: action.payload };
    case 'ADD_DEAL':
      return { ...state, deals: [action.payload, ...state.deals] };
    case 'UPDATE_DEAL':
      return {
        ...state,
        deals: state.deals.map(d =>
          d.id === action.payload.id ? action.payload : d
        ),
      };
    case 'SET_ACTIVITIES':
      return { ...state, activities: action.payload };
    case 'ADD_ACTIVITY':
      return { ...state, activities: [action.payload, ...state.activities] };
    default:
      return state;
  }
};

interface CRMContextType extends CRMState {
  createContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  createLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  createDeal: (deal: Omit<Deal, 'id' | 'createdAt'>) => Promise<void>;
  updateDeal: (id: string, updates: Partial<Deal>) => Promise<void>;
  createActivity: (activity: Omit<Activity, 'id' | 'createdAt'>) => Promise<void>;
  getAIInsights: () => Promise<any>;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(crmReducer, initialState);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [contacts, leads, deals, activities] = await Promise.all([
        crmAPI.getContacts(),
        crmAPI.getLeads(),
        crmAPI.getDeals(),
        crmAPI.getActivities(),
      ]);

      dispatch({ type: 'SET_CONTACTS', payload: contacts });
      dispatch({ type: 'SET_LEADS', payload: leads });
      dispatch({ type: 'SET_DEALS', payload: deals });
      dispatch({ type: 'SET_ACTIVITIES', payload: activities });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load CRM data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createContact = async (contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const contact = await crmAPI.createContact(contactData);
      dispatch({ type: 'ADD_CONTACT', payload: contact });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create contact' });
    }
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    try {
      const contact = await crmAPI.updateContact(id, updates);
      dispatch({ type: 'UPDATE_CONTACT', payload: contact });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update contact' });
    }
  };

  const deleteContact = async (id: string) => {
    try {
      await crmAPI.deleteContact(id);
      dispatch({ type: 'DELETE_CONTACT', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete contact' });
    }
  };

  const createLead = async (leadData: Omit<Lead, 'id' | 'createdAt'>) => {
    try {
      const lead = await crmAPI.createLead(leadData);
      dispatch({ type: 'ADD_LEAD', payload: lead });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create lead' });
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      const lead = await crmAPI.updateLead(id, updates);
      dispatch({ type: 'UPDATE_LEAD', payload: lead });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update lead' });
    }
  };

  const createDeal = async (dealData: Omit<Deal, 'id' | 'createdAt'>) => {
    try {
      const deal = await crmAPI.createDeal(dealData);
      dispatch({ type: 'ADD_DEAL', payload: deal });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create deal' });
    }
  };

  const updateDeal = async (id: string, updates: Partial<Deal>) => {
    try {
      const deal = await crmAPI.updateDeal(id, updates);
      dispatch({ type: 'UPDATE_DEAL', payload: deal });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update deal' });
    }
  };

  const createActivity = async (activityData: Omit<Activity, 'id' | 'createdAt'>) => {
    try {
      const activity = await crmAPI.createActivity(activityData);
      dispatch({ type: 'ADD_ACTIVITY', payload: activity });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create activity' });
    }
  };

  const getAIInsights = async () => {
    try {
      return await crmAPI.getAIInsights();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to get AI insights' });
      return null;
    }
  };

  const value: CRMContextType = {
    ...state,
    createContact,
    updateContact,
    deleteContact,
    createLead,
    updateLead,
    createDeal,
    updateDeal,
    createActivity,
    getAIInsights,
  };

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (context === undefined) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};
