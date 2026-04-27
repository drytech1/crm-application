"use client"

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, Users, Calendar, DollarSign, Mail, Settings, Search, Plus, Edit, Trash, X, ChevronRight, ArrowRight, ArrowUp, ArrowDown, Menu, Bell, Check, Clock, Play, Shield } from 'lucide-react'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Types
interface Contact {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip_code: string
  created_at: string
}

interface Deal {
  id: string
  name: string
  contact_id: string
  value: number
  stage: string
  expected_close_date: string
  notes: string
  created_at: string
  days_in_stage: number
}

interface Project {
  id: string
  name: string
  contact_id: string
  status: string
  start_date: string
  due_date: string
  notes: string
}

interface LineItem {
  id: string
  project_id: string
  description: string
  quantity: number
  rate: number
}

interface Task {
  id: string
  name: string
  due_date: string
  priority: string
  status: string
  linked_to: string
  linked_id: string
}

interface Email {
  id: string
  contact_id: string
  subject: string
  body: string
  sent_at: string
}

interface Automation {
  id: string
  name: string
  trigger: string
  action: string
  enabled: boolean
}

export default function CRMApplication() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [emails, setEmails] = useState<Email[]>([])
  const [automations, setAutomations] = useState<Automation[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterState, setFilterState] = useState('all')
  const [filterCity, setFilterCity] = useState('all')
  const [showContactModal, setShowContactModal] = useState(false)
  const [showDealModal, setShowDealModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showAutomationModal, setShowAutomationModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null)
  const [loading, setLoading] = useState(true)

  const pipelineStages = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']
  const projectStatuses = ['Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled']
  const taskPriorities = ['Low', 'Medium', 'High', 'Urgent']
  const taskStatuses = ['To Do', 'In Progress', 'Completed']

  // Load all data from Supabase
  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadContacts(),
        loadDeals(),
        loadProjects(),
        loadLineItems(),
        loadTasks(),
        loadEmails(),
        loadAutomations()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadContacts = async () => {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error loading contacts:', error)
    } else {
      setContacts(data || [])
    }
  }

  const loadDeals = async () => {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error loading deals:', error)
    } else {
      setDeals(data || [])
    }
  }

  const loadProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error loading projects:', error)
    } else {
      setProjects(data || [])
    }
  }

  const loadLineItems = async () => {
    const { data, error } = await supabase
      .from('line_items')
      .select('*')
    
    if (error) {
      console.error('Error loading line items:', error)
    } else {
      setLineItems(data || [])
    }
  }

  const loadTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true })
    
    if (error) {
      console.error('Error loading tasks:', error)
    } else {
      setTasks(data || [])
    }
  }

  const loadEmails = async () => {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .order('sent_at', { ascending: false })
    
    if (error) {
      console.error('Error loading emails:', error)
    } else {
      setEmails(data || [])
    }
  }

  const loadAutomations = async () => {
    const { data, error } = await supabase
      .from('automations')
      .select('*')
    
    if (error) {
      console.error('Error loading automations:', error)
    } else {
      setAutomations(data || [])
    }
  }

  // Contact Management Functions
  const addContact = async (contact: Omit<Contact, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('contacts')
      .insert([contact])
      .select()
    
    if (error) {
      console.error('Error adding contact:', error)
      alert('Error adding contact')
    } else {
      await loadContacts()
      setShowContactModal(false)
      setEditingContact(null)
    }
  }

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    const { error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
    
    if (error) {
      console.error('Error updating contact:', error)
      alert('Error updating contact')
    } else {
      await loadContacts()
      setShowContactModal(false)
      setEditingContact(null)
    }
  }

  const deleteContact = async (id: string) => {
    if (confirm('Are you sure you want to delete this contact? This will also delete all associated deals, projects, and emails.')) {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting contact:', error)
        alert('Error deleting contact')
      } else {
        await loadContacts()
        setSelectedContact(null)
      }
    }
  }

  // Deal Management Functions
  const addDeal = async (deal: Omit<Deal, 'id' | 'created_at' | 'days_in_stage'>) => {
    const { data, error } = await supabase
      .from('deals')
      .insert([{ ...deal, days_in_stage: 0 }])
      .select()
    
    if (error) {
      console.error('Error adding deal:', error)
      alert('Error adding deal')
    } else {
      await loadDeals()
      setShowDealModal(false)
      setEditingDeal(null)
    }
  }

  const updateDeal = async (id: string, updates: Partial<Deal>) => {
    const { error } = await supabase
      .from('deals')
      .update(updates)
      .eq('id', id)
    
    if (error) {
      console.error('Error updating deal:', error)
      alert('Error updating deal')
    } else {
      await loadDeals()
      setShowDealModal(false)
      setEditingDeal(null)
    }
  }

  const deleteDeal = async (id: string) => {
    if (confirm('Are you sure you want to delete this deal?')) {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting deal:', error)
        alert('Error deleting deal')
      } else {
        await loadDeals()
      }
    }
  }

  const moveDeal = async (dealId: string, newStage: string) => {
    const { error } = await supabase
      .from('deals')
      .update({ stage: newStage, days_in_stage: 0 })
      .eq('id', dealId)
    
    if (error) {
      console.error('Error moving deal:', error)
      alert('Error moving deal')
    } else {
      await loadDeals()
    }
  }

  // Project Management Functions
  const addProject = async (project: Omit<Project, 'id'>, charges: Omit<LineItem, 'id' | 'project_id'>[]) => {
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
    
    if (error) {
      console.error('Error adding project:', error)
      alert('Error adding project')
    } else if (data && data[0]) {
      // Add line items
      if (charges.length > 0) {
        const lineItemsToInsert = charges.map(charge => ({
          ...charge,
          project_id: data[0].id
        }))
        
        const { error: lineItemError } = await supabase
          .from('line_items')
          .insert(lineItemsToInsert)
        
        if (lineItemError) {
          console.error('Error adding line items:', lineItemError)
        }
      }
      
      await loadProjects()
      await loadLineItems()
      setShowProjectModal(false)
      setEditingProject(null)
    }
  }

  const updateProject = async (id: string, updates: Partial<Project>, charges: Omit<LineItem, 'id' | 'project_id'>[]) => {
    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
    
    if (error) {
      console.error('Error updating project:', error)
      alert('Error updating project')
    } else {
      // Delete existing line items and add new ones
      await supabase
        .from('line_items')
        .delete()
        .eq('project_id', id)
      
      if (charges.length > 0) {
        const lineItemsToInsert = charges.map(charge => ({
          ...charge,
          project_id: id
        }))
        
        await supabase
          .from('line_items')
          .insert(lineItemsToInsert)
      }
      
      await loadProjects()
      await loadLineItems()
      setShowProjectModal(false)
      setEditingProject(null)
    }
  }

  const deleteProject = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting project:', error)
        alert('Error deleting project')
      } else {
        await loadProjects()
        await loadLineItems()
      }
    }
  }

  // Email Functions
  const sendEmail = async (email: Omit<Email, 'id' | 'sent_at'>) => {
    const { data, error } = await supabase
      .from('emails')
      .insert([email])
      .select()
    
    if (error) {
      console.error('Error sending email:', error)
      alert('Error sending email')
    } else {
      await loadEmails()
      setShowEmailModal(false)
      alert('Email sent successfully!')
    }
  }

  // Task Functions
  const addTask = async (task: Omit<Task, 'id'>) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert([task])
      .select()
    
    if (error) {
      console.error('Error adding task:', error)
      alert('Error adding task')
    } else {
      await loadTasks()
      setShowTaskModal(false)
    }
  }

  const toggleTaskStatus = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (task) {
      const newStatus = task.status === 'Completed' ? 'To Do' : 'Completed'
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', id)
      
      if (error) {
        console.error('Error updating task:', error)
      } else {
        await loadTasks()
      }
    }
  }

  // Automation Functions
  const addAutomation = async (automation: Omit<Automation, 'id'>) => {
    const { data, error } = await supabase
      .from('automations')
      .insert([automation])
      .select()
    
    if (error) {
      console.error('Error adding automation:', error)
      alert('Error adding automation')
    } else {
      await loadAutomations()
      setShowAutomationModal(false)
    }
  }

  const toggleAutomation = async (id: string) => {
    const automation = automations.find(a => a.id === id)
    if (automation) {
      const { error } = await supabase
        .from('automations')
        .update({ enabled: !automation.enabled })
        .eq('id', id)
      
      if (error) {
        console.error('Error updating automation:', error)
      } else {
        await loadAutomations()
      }
    }
  }

  // Filter and Search
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesState = filterState === 'all' || contact.state === filterState
    const matchesCity = filterCity === 'all' || contact.city === filterCity
    return matchesSearch && matchesState && matchesCity
  })

  const getContactById = (id: string) => contacts.find(c => c.id === id)

  const getProjectsByContact = (contactId: string) => projects.filter(p => p.contact_id === contactId)

  const getDealsByContact = (contactId: string) => deals.filter(d => d.contact_id === contactId)

  const getEmailsByContact = (contactId: string) => emails.filter(e => e.contact_id === contactId)

  const getLineItemsByProject = (projectId: string) => lineItems.filter(li => li.project_id === projectId)

  const calculateProjectTotal = (projectId: string) => {
    const items = getLineItemsByProject(projectId)
    return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
  }

  const calculateContactTotal = (contactId: string) => {
    const contactProjects = getProjectsByContact(contactId)
    return contactProjects.reduce((sum, project) => sum + calculateProjectTotal(project.id), 0)
  }

  // Analytics Calculations
  const totalPipelineValue = deals.reduce((sum, deal) => sum + deal.value, 0)
  const activeDealCount = deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage)).length
  const wonDeals = deals.filter(d => d.stage === 'Closed Won')
  const lostDeals = deals.filter(d => d.stage === 'Closed Lost')
  const winRate = deals.length > 0 ? (wonDeals.length / (wonDeals.length + lostDeals.length) * 100) : 0
  const averageDealSize = wonDeals.length > 0 ? wonDeals.reduce((sum, d) => sum + d.value, 0) / wonDeals.length : 0

  const getDealsByStage = (stage: string) => deals.filter(d => d.stage === stage)

  const getStageValue = (stage: string) => {
    return getDealsByStage(stage).reduce((sum, deal) => sum + deal.value, 0)
  }

  // Drag and Drop Handlers
  const handleDragStart = (deal: Deal) => {
    setDraggedDeal(deal)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (stage: string) => {
    if (draggedDeal) {
      moveDeal(draggedDeal.id, stage)
      setDraggedDeal(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CRM...</p>
        </div>
      </div>
    )
  }

  // Render Functions
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={() => setShowContactModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.length}</div>
            <p className="text-xs text-gray-500 mt-1">Active clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDealCount}</div>
            <p className="text-xs text-gray-500 mt-1">In pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPipelineValue.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Total opportunity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <ArrowUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">Conversion rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Contacts</CardTitle>
            <CardDescription>Latest additions to your CRM</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contacts.slice(0, 5).map(contact => (
                <div key={contact.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>{contact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-gray-500">{contact.email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setSelectedContact(contact)
                    setActiveSection('contacts')
                  }}>
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>Tasks due soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.filter(t => t.status !== 'Completed').slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={task.status === 'Completed'}
                      onChange={() => toggleTaskStatus(task.id)}
                      className="h-4 w-4"
                    />
                    <div>
                      <p className="font-medium">{task.name}</p>
                      <p className="text-sm text-gray-500">Due: {new Date(task.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    task.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                    task.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                    task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderContacts = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Contacts</h1>
        <Button onClick={() => {
          setEditingContact(null)
          setShowContactModal(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterState} onValueChange={setFilterState}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {Array.from(new Set(contacts.map(c => c.state))).filter(s => s).map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCity} onValueChange={setFilterCity}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {Array.from(new Set(contacts.map(c => c.city))).filter(c => c).map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Phone</th>
                  <th className="text-left p-3 font-medium">City</th>
                  <th className="text-left p-3 font-medium">State</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map(contact => (
                  <tr key={contact.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{contact.name}</td>
                    <td className="p-3">{contact.email}</td>
                    <td className="p-3">{contact.phone}</td>
                    <td className="p-3">{contact.city}</td>
                    <td className="p-3">{contact.state}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedContact(contact)}>
                          View
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingContact(contact)
                          setShowContactModal(true)
                        }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteContact(contact.id)}>
                          <Trash className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedContact && (
        <ContactDetailView
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
          onEdit={() => {
            setEditingContact(selectedContact)
            setShowContactModal(true)
            setSelectedContact(null)
          }}
          onDelete={() => deleteContact(selectedContact.id)}
          projects={getProjectsByContact(selectedContact.id)}
          deals={getDealsByContact(selectedContact.id)}
          emails={getEmailsByContact(selectedContact.id)}
          totalCharges={calculateContactTotal(selectedContact.id)}
          getLineItemsByProject={getLineItemsByProject}
        />
      )}
    </div>
  )

  const renderPipeline = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sales Pipeline</h1>
        <Button onClick={() => {
          setEditingDeal(null)
          setShowDealModal(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Deal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPipelineValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Deal Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageDealSize.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
          {pipelineStages.map(stage => (
            <div
              key={stage}
              className="flex-shrink-0 w-80"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage)}
            >
              <Card className={`${stage === 'Closed Won' ? 'border-green-500' : stage === 'Closed Lost' ? 'border-red-500' : 'border-blue-500'} border-t-4`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">{stage}</CardTitle>
                  <CardDescription>
                    {getDealsByStage(stage).length} deals • ${getStageValue(stage).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {getDealsByStage(stage).map(deal => {
                    const contact = getContactById(deal.contact_id)
                    return (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={() => handleDragStart(deal)}
                        className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md cursor-move transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{deal.name}</h4>
                          <Button variant="ghost" size="sm" onClick={() => {
                            setEditingDeal(deal)
                            setShowDealModal(true)
                          }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{contact?.name}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">${deal.value.toLocaleString()}</span>
                          <span className="text-xs text-gray-500">{deal.days_in_stage} days</span>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderProjects = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Button onClick={() => {
          setEditingProject(null)
          setShowProjectModal(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => {
          const contact = getContactById(project.contact_id)
          const total = calculateProjectTotal(project.id)
          return (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription>{contact?.name}</CardDescription>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    project.status === 'Completed' ? 'bg-green-100 text-green-700' :
                    project.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                    project.status === 'On Hold' ? 'bg-yellow-100 text-yellow-700' :
                    project.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {project.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Start Date:</span>
                    <span>{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Due Date:</span>
                    <span>{project.due_date ? new Date(project.due_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-2 border-t">
                    <span>Total Charges:</span>
                    <span className="text-green-600">${total.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                      setEditingProject(project)
                      setShowProjectModal(true)
                    }}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteProject(project.id)}>
                      <Trash className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${wonDeals.reduce((sum, d) => sum + d.value, 0).toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <ArrowUp className="h-3 w-3 mr-1" />
              {wonDeals.length} deals won
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.filter(p => p.status === 'In Progress').length}</div>
            <p className="text-xs text-gray-500 mt-1">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emails.length}</div>
            <p className="text-xs text-gray-500 mt-1">Total communications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'Completed').length}</div>
            <p className="text-xs text-gray-500 mt-1">Out of {tasks.length} total</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>Deal progression through pipeline stages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pipelineStages.filter(s => !s.includes('Closed')).map((stage, index) => {
              const stageDeals = getDealsByStage(stage)
              const maxDeals = Math.max(...pipelineStages.map(s => getDealsByStage(s).length))
              const percentage = maxDeals > 0 ? (stageDeals.length / maxDeals) * 100 : 0
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{stage}</span>
                    <span className="text-sm text-gray-600">{stageDeals.length} deals</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-8">
                    <div
                      className="bg-blue-600 h-8 rounded-full flex items-center justify-end pr-3 text-white text-sm font-medium"
                      style={{ width: `${percentage}%` }}
                    >
                      {percentage > 20 && `${percentage.toFixed(0)}%`}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Contacts by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contacts
                .map(contact => ({
                  contact,
                  total: calculateContactTotal(contact.id)
                }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5)
                .map(({ contact, total }) => (
                  <div key={contact.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>{contact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-gray-500">{contact.email}</p>
                      </div>
                    </div>
                    <span className="font-bold text-green-600">${total.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projectStatuses.map(status => {
                const count = projects.filter(p => p.status === status).length
                const percentage = projects.length > 0 ? (count / projects.length) * 100 : 0
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{status}</span>
                      <span className="text-sm text-gray-600">{count} projects</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          status === 'Completed' ? 'bg-green-600' :
                          status === 'In Progress' ? 'bg-blue-600' :
                          status === 'On Hold' ? 'bg-yellow-600' :
                          status === 'Cancelled' ? 'bg-red-600' :
                          'bg-gray-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderAutomation = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Automation</h1>
        <Button onClick={() => setShowAutomationModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Automations</CardTitle>
            <CardDescription>Rules currently running</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {automations.filter(a => a.enabled).map(automation => (
                <div key={automation.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{automation.name}</h4>
                    <Button variant="ghost" size="sm" onClick={() => toggleAutomation(automation.id)}>
                      <Shield className="h-4 w-4 text-green-600" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    When <span className="font-medium">{automation.trigger}</span> → <span className="font-medium">{automation.action}</span>
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inactive Automations</CardTitle>
            <CardDescription>Disabled rules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {automations.filter(a => !a.enabled).map(automation => (
                <div key={automation.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-600">{automation.name}</h4>
                    <Button variant="ghost" size="sm" onClick={() => toggleAutomation(automation.id)}>
                      <Play className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    When <span className="font-medium">{automation.trigger}</span> → <span className="font-medium">{automation.action}</span>
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>Manage your to-do list</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button onClick={() => setShowTaskModal(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
            {tasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={task.status === 'Completed'}
                    onChange={() => toggleTaskStatus(task.id)}
                    className="h-4 w-4"
                  />
                  <div>
                    <p className={`font-medium ${task.status === 'Completed' ? 'line-through text-gray-500' : ''}`}>
                      {task.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Due: {new Date(task.due_date).toLocaleDateString()} • {task.linked_to}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  task.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                  task.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                  task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b flex items-center justify-between">
          {sidebarOpen && <h2 className="text-xl font-bold text-blue-600">CRM Pro</h2>}
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'dashboard', icon: Home, label: 'Dashboard' },
            { id: 'contacts', icon: Users, label: 'Contacts' },
            { id: 'pipeline', icon: Calendar, label: 'Pipeline' },
            { id: 'projects', icon: DollarSign, label: 'Projects' },
            { id: 'analytics', icon: ArrowUp, label: 'Analytics' },
            { id: 'automation', icon: Settings, label: 'Automation' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeSection === item.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input placeholder="Search..." className="pl-10" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Bell className="h-5 w-5" />
            </Button>
            <Avatar>
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {activeSection === 'dashboard' && renderDashboard()}
          {activeSection === 'contacts' && renderContacts()}
          {activeSection === 'pipeline' && renderPipeline()}
          {activeSection === 'projects' && renderProjects()}
          {activeSection === 'analytics' && renderAnalytics()}
          {activeSection === 'automation' && renderAutomation()}
        </main>
      </div>

      {/* Modals */}
      {showContactModal && (
        <ContactModal
          contact={editingContact}
          onSave={(contact) => {
            if (editingContact) {
              updateContact(editingContact.id, contact)
            } else {
              addContact(contact)
            }
          }}
          onClose={() => {
            setShowContactModal(false)
            setEditingContact(null)
          }}
        />
      )}

      {showDealModal && (
        <DealModal
          deal={editingDeal}
          contacts={contacts}
          onSave={(deal) => {
            if (editingDeal) {
              updateDeal(editingDeal.id, deal)
            } else {
              addDeal(deal)
            }
          }}
          onClose={() => {
            setShowDealModal(false)
            setEditingDeal(null)
          }}
        />
      )}

      {showProjectModal && (
        <ProjectModal
          project={editingProject}
          contacts={contacts}
          lineItems={editingProject ? getLineItemsByProject(editingProject.id) : []}
          onSave={(project, charges) => {
            if (editingProject) {
              updateProject(editingProject.id, project, charges)
            } else {
              addProject(project, charges)
            }
          }}
          onClose={() => {
            setShowProjectModal(false)
            setEditingProject(null)
          }}
        />
      )}

      {showEmailModal && selectedContact && (
        <EmailModal
          contact={selectedContact}
          onSend={(email) => sendEmail(email)}
          onClose={() => setShowEmailModal(false)}
        />
      )}

      {showTaskModal && (
        <TaskModal
          contacts={contacts}
          deals={deals}
          projects={projects}
          onSave={(task) => addTask(task)}
          onClose={() => setShowTaskModal(false)}
        />
      )}

      {showAutomationModal && (
        <AutomationModal
          onSave={(automation) => addAutomation(automation)}
          onClose={() => setShowAutomationModal(false)}
        />
      )}
    </div>
  )
}

// Contact Detail View Component
function ContactDetailView({
  contact,
  onClose,
  onEdit,
  onDelete,
  projects,
  deals,
  emails,
  totalCharges,
  getLineItemsByProject
}: {
  contact: Contact
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  projects: Project[]
  deals: Deal[]
  emails: Email[]
  totalCharges: number
  getLineItemsByProject: (projectId: string) => LineItem[]
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{contact.name}</CardTitle>
              <CardDescription>{contact.email}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-3">Contact Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span>{contact.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Address:</span>
                  <span>{contact.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">City:</span>
                  <span>{contact.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">State:</span>
                  <span>{contact.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Zip Code:</span>
                  <span>{contact.zip_code}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Projects:</span>
                  <span>{projects.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Deals:</span>
                  <span>{deals.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Charges:</span>
                  <span className="font-bold text-green-600">${totalCharges.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Emails Sent:</span>
                  <span>{emails.length}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Projects</h3>
            <div className="space-y-2">
              {projects.map(project => {
                const items = getLineItemsByProject(project.id)
                const total = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
                return (
                  <div key={project.id} className="p-3 border rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-gray-500">{project.status}</p>
                    </div>
                    <span className="font-bold text-green-600">
                      ${total.toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {emails.slice(0, 5).map(email => (
                <div key={email.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{email.subject}</p>
                    <span className="text-xs text-gray-500">{new Date(email.sent_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{email.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={onEdit} className="flex-1">
              <Edit className="mr-2 h-4 w-4" />
              Edit Contact
            </Button>
            <Button variant="outline" onClick={onDelete} className="flex-1">
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Contact Modal Component
function ContactModal({
  contact,
  onSave,
  onClose
}: {
  contact: Contact | null
  onSave: (contact: Omit<Contact, 'id' | 'created_at'>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    address: contact?.address || '',
    city: contact?.city || '',
    state: contact?.state || '',
    zip_code: contact?.zip_code || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{contact ? 'Edit Contact' : 'Add New Contact'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="zip_code">Zip Code</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Contact</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Deal Modal Component
function DealModal({
  deal,
  contacts,
  onSave,
  onClose
}: {
  deal: Deal | null
  contacts: Contact[]
  onSave: (deal: Omit<Deal, 'id' | 'created_at' | 'days_in_stage'>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    name: deal?.name || '',
    contact_id: deal?.contact_id || '',
    value: deal?.value || 0,
    stage: deal?.stage || 'Lead',
    expected_close_date: deal?.expected_close_date || '',
    notes: deal?.notes || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const pipelineStages = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{deal ? 'Edit Deal' : 'Add New Deal'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="dealName">Deal Name *</Label>
              <Input
                id="dealName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="contact">Contact *</Label>
              <Select value={formData.contact_id} onValueChange={(value) => setFormData({ ...formData, contact_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>{contact.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="value">Deal Value *</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="stage">Stage *</Label>
                <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelineStages.map(stage => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="expected_close_date">Expected Close Date</Label>
              <Input
                id="expected_close_date"
                type="date"
                value={formData.expected_close_date}
                onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Deal</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Project Modal Component
function ProjectModal({
  project,
  contacts,
  lineItems,
  onSave,
  onClose
}: {
  project: Project | null
  contacts: Contact[]
  lineItems: LineItem[]
  onSave: (project: Omit<Project, 'id'>, charges: Omit<LineItem, 'id' | 'project_id'>[]) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    contact_id: project?.contact_id || '',
    status: project?.status || 'Not Started',
    start_date: project?.start_date || '',
    due_date: project?.due_date || '',
    notes: project?.notes || ''
  })

  const [charges, setCharges] = useState<Omit<LineItem, 'id' | 'project_id'>[]>(
    lineItems.map(item => ({
      description: item.description,
      quantity: item.quantity,
      rate: item.rate
    }))
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData, charges)
  }

  const addLineItem = () => {
    setCharges([...charges, { description: '', quantity: 1, rate: 0 }])
  }

  const updateLineItem = (index: number, updates: Partial<Omit<LineItem, 'id' | 'project_id'>>) => {
    const newCharges = [...charges]
    newCharges[index] = { ...newCharges[index], ...updates }
    setCharges(newCharges)
  }

  const removeLineItem = (index: number) => {
    setCharges(charges.filter((_, i) => i !== index))
  }

  const projectStatuses = ['Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled']

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <CardTitle>{project ? 'Edit Project' : 'Add New Project'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="projectName">Project Name *</Label>
              <Input
                id="projectName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="projectContact">Contact *</Label>
              <Select value={formData.contact_id} onValueChange={(value) => setFormData({ ...formData, contact_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>{contact.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projectStatuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="projectNotes">Notes</Label>
              <Textarea
                id="projectNotes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Billing Charges</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Line Item
                </Button>
              </div>
              <div className="space-y-2">
                {charges.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, { description: e.target.value })}
                      className="col-span-5"
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, { quantity: parseFloat(e.target.value) })}
                      className="col-span-2"
                    />
                    <Input
                      type="number"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={(e) => updateLineItem(index, { rate: parseFloat(e.target.value) })}
                      className="col-span-2"
                    />
                    <div className="col-span-2 font-medium">
                      ${(item.quantity * item.rate).toFixed(2)}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(index)}
                      className="col-span-1"
                    >
                      <Trash className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
                {charges.length > 0 && (
                  <div className="flex justify-end font-bold text-lg pt-2 border-t">
                    Total: ${charges.reduce((sum, item) => sum + (item.quantity * item.rate), 0).toFixed(2)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Project</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Email Modal Component
function EmailModal({
  contact,
  onSend,
  onClose
}: {
  contact: Contact
  onSend: (email: Omit<Email, 'id' | 'sent_at'>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    subject: '',
    body: ''
  })

  const templates = [
    { name: 'Follow Up', subject: 'Following up on our conversation', body: 'Hi [Name],\n\nI wanted to follow up on our recent conversation...' },
    { name: 'Project Update', subject: 'Project Status Update', body: 'Hi [Name],\n\nHere is an update on your project...' },
    { name: 'Invoice', subject: 'Invoice for Services', body: 'Hi [Name],\n\nPlease find attached the invoice for services rendered...' }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSend({
      contact_id: contact.id,
      subject: formData.subject,
      body: formData.body
    })
  }

  const applyTemplate = (template: typeof templates[0]) => {
    setFormData({
      subject: template.subject,
      body: template.body.replace('[Name]', contact.name.split(' ')[0])
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Send Email to {contact.name}</CardTitle>
          <CardDescription>{contact.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Email Templates</Label>
              <div className="flex gap-2 mt-2">
                {templates.map(template => (
                  <Button
                    key={template.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(template)}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="body">Message *</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={10}
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Task Modal Component
function TaskModal({
  contacts,
  deals,
  projects,
  onSave,
  onClose
}: {
  contacts: Contact[]
  deals: Deal[]
  projects: Project[]
  onSave: (task: Omit<Task, 'id'>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    due_date: '',
    priority: 'Medium',
    status: 'To Do',
    linked_to: 'Contact',
    linked_id: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const taskPriorities = ['Low', 'Medium', 'High', 'Urgent']
  const taskStatuses = ['To Do', 'In Progress', 'Completed']
  const linkTypes = ['Contact', 'Deal', 'Project']

  const getLinkedItems = () => {
    switch (formData.linked_to) {
      case 'Contact':
        return contacts
      case 'Deal':
        return deals
      case 'Project':
        return projects
      default:
        return []
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Add New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="taskName">Task Name *</Label>
              <Input
                id="taskName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="due_date">Due Date *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority *</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taskPriorities.map(priority => (
                      <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="linked_to">Link To *</Label>
                <Select value={formData.linked_to} onValueChange={(value) => setFormData({ ...formData, linked_to: value, linked_id: '' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {linkTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="linked_id">Select Item *</Label>
                <Select value={formData.linked_id} onValueChange={(value) => setFormData({ ...formData, linked_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an item" />
                  </SelectTrigger>
                  <SelectContent>
                    {getLinkedItems().map(item => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Task</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Automation Modal Component
function AutomationModal({
  onSave,
  onClose
}: {
  onSave: (automation: Omit<Automation, 'id'>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    trigger: 'Contact Created',
    action: 'Send Email',
    enabled: true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const triggers = ['Contact Created', 'Deal Stage Changed', 'Project Status Updated', 'Task Due Soon']
  const actions = ['Send Email', 'Create Task', 'Update Field', 'Move Deal Stage']

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Create Automation Rule</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="automationName">Rule Name *</Label>
              <Input
                id="automationName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="trigger">When this happens *</Label>
              <Select value={formData.trigger} onValueChange={(value) => setFormData({ ...formData, trigger: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {triggers.map(trigger => (
                    <SelectItem key={trigger} value={trigger}>{trigger}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="action">Do this *</Label>
              <Select value={formData.action} onValueChange={(value) => setFormData({ ...formData, action: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actions.map(action => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="enabled">Enable this automation immediately</Label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Create Rule</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// END OF FILE

// END OF FILE
