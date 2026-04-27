"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, Users, Calendar, DollarSign, Mail, Settings, Search, Plus, Edit, Trash, X, ChevronRight, ArrowRight, ArrowUp, ArrowDown, Menu, Bell, Check, Clock, Play, Shield, Download, Send } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Types
interface Contact {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  createdAt: string
}

interface Deal {
  id: string
  name: string
  contactId: string
  value: number
  stage: string
  expectedCloseDate: string
  notes: string
  createdAt: string
  daysInStage: number
}

interface Project {
  id: string
  name: string
  contactId: string
  status: string
  startDate: string
  dueDate: string
  charges: LineItem[]
  notes: string
  paymentStatus?: string
  paidAmount?: number
  invoiceNumber?: string
  invoiceDate?: string
  dueDate2?: string
}

interface LineItem {
  id: string
  description: string
  quantity: number
  rate: number
}

interface Task {
  id: string
  name: string
  dueDate: string
  priority: string
  status: string
  linkedTo: string
  linkedId: string
}

interface Email {
  id: string
  contactId: string
  subject: string
  body: string
  sentAt: string
}

interface Automation {
  id: string
  name: string
  trigger: string
  action: string
  enabled: boolean
}

interface Payment {
  id: string
  projectId: string
  amount: number
  status: string
  paymentDate: string
  paymentMethod: string
}

export default function CRMApplication() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [emails, setEmails] = useState<Email[]>([])
  const [automations, setAutomations] = useState<Automation[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterState, setFilterState] = useState('all')
  const [filterCity, setFilterCity] = useState('all')
  const [showContactModal, setShowContactModal] = useState(false)
  const [showDealModal, setShowDealModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showAutomationModal, setShowAutomationModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedProjectForPayment, setSelectedProjectForPayment] = useState<Project | null>(null)
  const [selectedProjectForInvoice, setSelectedProjectForInvoice] = useState<Project | null>(null)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null)

  const pipelineStages = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']
  const projectStatuses = ['Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled']
  const taskPriorities = ['Low', 'Medium', 'High', 'Urgent']
  const taskStatuses = ['To Do', 'In Progress', 'Completed']

  // Load data from localStorage
  useEffect(() => {
    const savedContacts = localStorage.getItem('crm_contacts')
    const savedDeals = localStorage.getItem('crm_deals')
    const savedProjects = localStorage.getItem('crm_projects')
    const savedTasks = localStorage.getItem('crm_tasks')
    const savedEmails = localStorage.getItem('crm_emails')
    const savedAutomations = localStorage.getItem('crm_automations')
    const savedPayments = localStorage.getItem('crm_payments')

    if (savedContacts) setContacts(JSON.parse(savedContacts))
    if (savedDeals) setDeals(JSON.parse(savedDeals))
    if (savedProjects) {
      const loadedProjects = JSON.parse(savedProjects)
      const migratedProjects = loadedProjects.map((p: Project) => ({
        ...p,
        paymentStatus: p.paymentStatus || 'Pending',
        paidAmount: p.paidAmount || 0
      }))
      setProjects(migratedProjects)
    }
    if (savedTasks) setTasks(JSON.parse(savedTasks))
    if (savedEmails) setEmails(JSON.parse(savedEmails))
    if (savedAutomations) setAutomations(JSON.parse(savedAutomations))
    if (savedPayments) setPayments(JSON.parse(savedPayments))
  }, [])

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('crm_contacts', JSON.stringify(contacts))
  }, [contacts])

  useEffect(() => {
    localStorage.setItem('crm_deals', JSON.stringify(deals))
  }, [deals])

  useEffect(() => {
    localStorage.setItem('crm_projects', JSON.stringify(projects))
  }, [projects])

  useEffect(() => {
    localStorage.setItem('crm_tasks', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem('crm_emails', JSON.stringify(emails))
  }, [emails])

  useEffect(() => {
    localStorage.setItem('crm_automations', JSON.stringify(automations))
  }, [automations])

  useEffect(() => {
    localStorage.setItem('crm_payments', JSON.stringify(payments))
  }, [payments])

  // Contact Management Functions
  const addContact = (contact: Omit<Contact, 'id' | 'createdAt'>) => {
    const newContact: Contact = {
      ...contact,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    setContacts([...contacts, newContact])
    setShowContactModal(false)
    setEditingContact(null)
  }

  const updateContact = (id: string, updates: Partial<Contact>) => {
    setContacts(contacts.map(c => c.id === id ? { ...c, ...updates } : c))
    setShowContactModal(false)
    setEditingContact(null)
  }

  const deleteContact = (id: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      setContacts(contacts.filter(c => c.id !== id))
      setSelectedContact(null)
    }
  }

  // Deal Management Functions
  const addDeal = (deal: Omit<Deal, 'id' | 'createdAt' | 'daysInStage'>) => {
    const newDeal: Deal = {
      ...deal,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      daysInStage: 0
    }
    setDeals([...deals, newDeal])
    setShowDealModal(false)
    setEditingDeal(null)
  }

  const updateDeal = (id: string, updates: Partial<Deal>) => {
    setDeals(deals.map(d => d.id === id ? { ...d, ...updates } : d))
    setShowDealModal(false)
    setEditingDeal(null)
  }

  const deleteDeal = (id: string) => {
    if (confirm('Are you sure you want to delete this deal?')) {
      setDeals(deals.filter(d => d.id !== id))
    }
  }

  const moveDeal = (dealId: string, newStage: string) => {
    setDeals(deals.map(d => d.id === dealId ? { ...d, stage: newStage, daysInStage: 0 } : d))
  }

  // Project Management Functions
  const addProject = (project: Omit<Project, 'id' | 'paymentStatus' | 'paidAmount'>) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      paymentStatus: 'Pending',
      paidAmount: 0
    }
    setProjects([...projects, newProject])
    setShowProjectModal(false)
    setEditingProject(null)
  }

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(projects.map(p => p.id === id ? { ...p, ...updates } : p))
    setShowProjectModal(false)
    setEditingProject(null)
  }

  const deleteProject = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      setProjects(projects.filter(p => p.id !== id))
    }
  }

  // Payment Functions
  const addPayment = (payment: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...payment,
      id: Date.now().toString()
    }
    setPayments([...payments, newPayment])
    
    const project = projects.find(p => p.id === payment.projectId)
    if (project) {
      const currentPaidAmount = project.paidAmount || 0
      const newPaidAmount = currentPaidAmount + payment.amount
      const totalAmount = calculateProjectTotal(project)
      const newStatus = newPaidAmount >= totalAmount ? 'Paid' : 'Partial'
      updateProject(payment.projectId, {
        paidAmount: newPaidAmount,
        paymentStatus: newStatus
      })
    }
  }

  // Email Functions
  const sendEmail = (email: Omit<Email, 'id' | 'sentAt'>) => {
    const newEmail: Email = {
      ...email,
      id: Date.now().toString(),
      sentAt: new Date().toISOString()
    }
    setEmails([...emails, newEmail])
    setShowEmailModal(false)
  }

  // Task Functions
  const addTask = (task: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString()
    }
    setTasks([...tasks, newTask])
    setShowTaskModal(false)
  }

  const toggleTaskStatus = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === 'Completed' ? 'To Do' : 'Completed' } : t))
  }

  // Automation Functions
  const addAutomation = (automation: Omit<Automation, 'id'>) => {
    const newAutomation: Automation = {
      ...automation,
      id: Date.now().toString()
    }
    setAutomations([...automations, newAutomation])
    setShowAutomationModal(false)
  }

  const toggleAutomation = (id: string) => {
    setAutomations(automations.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a))
  }

  // Invoice Functions
  const generateInvoiceNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `INV-${year}${month}-${random}`
  }

  const sendInvoice = async (projectId: string, invoiceData: { invoiceNumber: string; invoiceDate: string; dueDate: string }) => {
  const project = projects.find(p => p.id === projectId)
  const contact = project ? getContactById(project.contactId) : null
  
  if (project && contact) {
    updateProject(projectId, {
      invoiceNumber: invoiceData.invoiceNumber,
      invoiceDate: invoiceData.invoiceDate,
      dueDate2: invoiceData.dueDate
    })

    const total = calculateProjectTotal(project)
    const paidAmount = project.paidAmount || 0
    const remaining = total - paidAmount

    // Prepare invoice data for email
    const emailInvoiceData = {
      invoiceNumber: invoiceData.invoiceNumber,
      invoiceDate: new Date(invoiceData.invoiceDate).toLocaleDateString(),
      dueDate: new Date(invoiceData.dueDate).toLocaleDateString(),
      projectName: project.name,
      clientName: contact.name,
      clientEmail: contact.email,
      clientPhone: contact.phone,
      clientAddress: contact.address,
      clientCity: contact.city,
      clientState: contact.state,
      clientZip: contact.zipCode,
      lineItems: project.charges,
      subtotal: total,
      paidAmount: paidAmount,
      amountDue: remaining
    }

    try {
      // Send invoice via API
      const response = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: contact.email,
          subject: `Invoice ${invoiceData.invoiceNumber} - ${project.name}`,
          body: `Please find your invoice for ${project.name}.`,
          invoiceData: emailInvoiceData
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Save email to history
        const invoiceEmail = {
          contactId: contact.id,
          subject: `Invoice ${invoiceData.invoiceNumber} - ${project.name}`,
          body: `Invoice sent for ${project.name}. Amount due: $${remaining.toFixed(2)}`,
        }
        sendEmail(invoiceEmail)
        
        alert('Invoice sent successfully to ' + contact.email + '!')
      } else {
        alert('Failed to send invoice. Please try again.')
      }
    } catch (error) {
      console.error('Error sending invoice:', error)
      alert('Failed to send invoice. Please check your email configuration.')
    }

    setShowInvoiceModal(false)
    setSelectedProjectForInvoice(null)
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

  const getProjectsByContact = (contactId: string) => projects.filter(p => p.contactId === contactId)

  const getDealsByContact = (contactId: string) => deals.filter(d => d.contactId === contactId)

  const getEmailsByContact = (contactId: string) => emails.filter(e => e.contactId === contactId)

  const getPaymentsByProject = (projectId: string) => payments.filter(p => p.projectId === projectId)

  const calculateProjectTotal = (project: Project) => {
    return project.charges.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
  }

  const calculateContactTotal = (contactId: string) => {
    const contactProjects = getProjectsByContact(contactId)
    return contactProjects.reduce((sum, project) => sum + calculateProjectTotal(project), 0)
  }

  // Analytics Calculations
  const totalPipelineValue = deals.reduce((sum, deal) => sum + deal.value, 0)
  const activeDealCount = deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage)).length
  const wonDeals = deals.filter(d => d.stage === 'Closed Won')
  const lostDeals = deals.filter(d => d.stage === 'Closed Lost')
  const winRate = deals.length > 0 ? (wonDeals.length / (wonDeals.length + lostDeals.length) * 100) : 0
  const averageDealSize = wonDeals.length > 0 ? wonDeals.reduce((sum, d) => sum + d.value, 0) / wonDeals.length : 0
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0)

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
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <ArrowUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Payments received</p>
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
                      <p className="text-sm text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
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
                {Array.from(new Set(contacts.map(c => c.state))).map(state => (
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
                {Array.from(new Set(contacts.map(c => c.city))).map(city => (
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
                    const contact = getContactById(deal.contactId)
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
                          <span className="text-xs text-gray-500">{deal.daysInStage} days</span>
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
          const contact = getContactById(project.contactId)
          const total = calculateProjectTotal(project)
          const paidAmount = project.paidAmount || 0
          const remaining = total - paidAmount
          const paymentStatus = project.paymentStatus || 'Pending'
          
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
                    <span>{new Date(project.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Due Date:</span>
                    <span>{new Date(project.dueDate).toLocaleDateString()}</span>
                  </div>
                  {project.invoiceNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Invoice #:</span>
                      <span className="font-medium">{project.invoiceNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold pt-2 border-t">
                    <span>Total Charges:</span>
                    <span className="text-green-600">${total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Paid:</span>
                    <span>${paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span>Remaining:</span>
                    <span className={remaining > 0 ? 'text-red-600' : 'text-green-600'}>
                      ${remaining.toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                      paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {paymentStatus}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                      setEditingProject(project)
                      setShowProjectModal(true)
                    }}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setSelectedProjectForInvoice(project)
                        setShowInvoiceModal(true)
                      }}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Invoice
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    {remaining > 0 && (
                      <Button size="sm" className="flex-1" onClick={() => {
                        setSelectedProjectForPayment(project)
                        setShowPaymentModal(true)
                      }}>
                        <DollarSign className="h-3 w-3 mr-1" />
                        Pay
                      </Button>
                    )}
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
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <ArrowUp className="h-3 w-3 mr-1" />
              {payments.length} payments
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
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.slice(0, 5).map(payment => {
                const project = projects.find(p => p.id === payment.projectId)
                const contact = project ? getContactById(project.contactId) : null
                return (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{project?.name}</p>
                      <p className="text-sm text-gray-500">{contact?.name}</p>
                      <p className="text-xs text-gray-400">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">${payment.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{payment.paymentMethod}</p>
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
                      Due: {new Date(task.dueDate).toLocaleDateString()} • {task.linkedTo}
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
          onSave={(project) => {
            if (editingProject) {
              updateProject(editingProject.id, project)
            } else {
              addProject(project)
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

      {showPaymentModal && selectedProjectForPayment && (
        <Elements stripe={stripePromise}>
          <PaymentModal
            project={selectedProjectForPayment}
            onPaymentSuccess={(payment) => {
              addPayment(payment)
              setShowPaymentModal(false)
              setSelectedProjectForPayment(null)
            }}
            onClose={() => {
              setShowPaymentModal(false)
              setSelectedProjectForPayment(null)
            }}
          />
        </Elements>
      )}

      {showInvoiceModal && selectedProjectForInvoice && (
        <InvoiceModal
          project={selectedProjectForInvoice}
          contact={getContactById(selectedProjectForInvoice.contactId)!}
          onSend={(invoiceData) => sendInvoice(selectedProjectForInvoice.id, invoiceData)}
          onClose={() => {
            setShowInvoiceModal(false)
            setSelectedProjectForInvoice(null)
          }}
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
  totalCharges
}: {
  contact: Contact
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  projects: Project[]
  deals: Deal[]
  emails: Email[]
  totalCharges: number
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
                  <span>{contact.zipCode}</span>
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
              {projects.map(project => (
                <div key={project.id} className="p-3 border rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-gray-500">{project.status}</p>
                  </div>
                  <span className="font-bold text-green-600">
                    ${project.charges.reduce((sum, item) => sum + (item.quantity * item.rate), 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {emails.slice(0, 5).map(email => (
                <div key={email.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{email.subject}</p>
                    <span className="text-xs text-gray-500">{new Date(email.sentAt).toLocaleDateString()}</span>
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

// Invoice Modal Component
function InvoiceModal({
  project,
  contact,
  onSend,
  onClose
}: {
  project: Project
  contact: Contact
  onSend: (invoiceData: { invoiceNumber: string; invoiceDate: string; dueDate: string }) => void
  onClose: () => void
}) {
  const [invoiceNumber, setInvoiceNumber] = useState(project.invoiceNumber || '')
  const [invoiceDate, setInvoiceDate] = useState(project.invoiceDate || new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState(project.dueDate2 || '')

  useEffect(() => {
    if (!invoiceNumber) {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      setInvoiceNumber(`INV-${year}${month}-${random}`)
    }
  }, [invoiceNumber])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSend({ invoiceNumber, invoiceDate, dueDate })
  }

  const total = project.charges.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
  const paidAmount = project.paidAmount || 0
  const remaining = total - paidAmount

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Send Invoice to Client</CardTitle>
              <CardDescription>{contact.name} - {contact.email}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="invoiceDate">Invoice Date *</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold mb-4">Invoice Preview</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold">Bill To:</p>
                    <p>{contact.name}</p>
                    <p>{contact.email}</p>
                    <p>{contact.phone}</p>
                    <p>{contact.address}</p>
                    <p>{contact.city}, {contact.state} {contact.zipCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Invoice Details:</p>
                    <p>Invoice #: {invoiceNumber}</p>
                    <p>Date: {new Date(invoiceDate).toLocaleDateString()}</p>
                    <p>Due: {dueDate ? new Date(dueDate).toLocaleDateString() : 'Not set'}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="font-semibold mb-2">Project: {project.name}</p>
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2">Description</th>
                        <th className="text-right py-2">Qty</th>
                        <th className="text-right py-2">Rate</th>
                        <th className="text-right py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.charges.map(item => (
                        <tr key={item.id} className="border-b">
                          <td className="py-2">{item.description}</td>
                          <td className="text-right py-2">{item.quantity}</td>
                          <td className="text-right py-2">${item.rate.toFixed(2)}</td>
                          <td className="text-right py-2">${(item.quantity * item.rate).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Already Paid:</span>
                    <span className="text-green-600">-${paidAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Amount Due:</span>
                    <span className="text-red-600">${remaining.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This will send an email to {contact.email} with the invoice details and payment instructions.
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">
                <Send className="mr-2 h-4 w-4" />
                Send Invoice
              </Button>
            </div>
          </form>
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
  onSave: (contact: Omit<Contact, 'id' | 'createdAt'>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    address: contact?.address || '',
    city: contact?.city || '',
    state: contact?.state || '',
    zipCode: contact?.zipCode || ''
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
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
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
  onSave: (deal: Omit<Deal, 'id' | 'createdAt' | 'daysInStage'>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    name: deal?.name || '',
    contactId: deal?.contactId || '',
    value: deal?.value || 0,
    stage: deal?.stage || 'Lead',
    expectedCloseDate: deal?.expectedCloseDate || '',
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
              <Select value={formData.contactId} onValueChange={(value) => setFormData({ ...formData, contactId: value })}>
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
              <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
              <Input
                id="expectedCloseDate"
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
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
  onSave,
  onClose
}: {
  project: Project | null
  contacts: Contact[]
  onSave: (project: Omit<Project, 'id' | 'paymentStatus' | 'paidAmount'>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    contactId: project?.contactId || '',
    status: project?.status || 'Not Started',
    startDate: project?.startDate || '',
    dueDate: project?.dueDate || '',
    notes: project?.notes || '',
    charges: project?.charges || []
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const addLineItem = () => {
    setFormData({
      ...formData,
      charges: [...formData.charges, { id: Date.now().toString(), description: '', quantity: 1, rate: 0 }]
    })
  }

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setFormData({
      ...formData,
      charges: formData.charges.map(item => item.id === id ? { ...item, ...updates } : item)
    })
  }

  const removeLineItem = (id: string) => {
    setFormData({
      ...formData,
      charges: formData.charges.filter(item => item.id !== id)
    })
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
              <Select value={formData.contactId} onValueChange={(value) => setFormData({ ...formData, contactId: value })}>
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
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
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
                {formData.charges.map(item => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                      className="col-span-5"
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, { quantity: parseFloat(e.target.value) })}
                      className="col-span-2"
                    />
                    <Input
                      type="number"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={(e) => updateLineItem(item.id, { rate: parseFloat(e.target.value) })}
                      className="col-span-2"
                    />
                    <div className="col-span-2 font-medium">
                      ${(item.quantity * item.rate).toFixed(2)}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(item.id)}
                      className="col-span-1"
                    >
                      <Trash className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
                {formData.charges.length > 0 && (
                  <div className="flex justify-end font-bold text-lg pt-2 border-t">
                    Total: ${formData.charges.reduce((sum, item) => sum + (item.quantity * item.rate), 0).toFixed(2)}
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
  onSend: (email: Omit<Email, 'id' | 'sentAt'>) => void
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
      contactId: contact.id,
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
    dueDate: '',
    priority: 'Medium',
    status: 'To Do',
    linkedTo: 'Contact',
    linkedId: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const taskPriorities = ['Low', 'Medium', 'High', 'Urgent']
  const taskStatuses = ['To Do', 'In Progress', 'Completed']
  const linkTypes = ['Contact', 'Deal', 'Project']

  const getLinkedItems = () => {
    switch (formData.linkedTo) {
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
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
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
                <Label htmlFor="linkedTo">Link To *</Label>
                <Select value={formData.linkedTo} onValueChange={(value) => setFormData({ ...formData, linkedTo: value, linkedId: '' })}>
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
                <Label htmlFor="linkedId">Select Item *</Label>
                <Select value={formData.linkedId} onValueChange={(value) => setFormData({ ...formData, linkedId: value })}>
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

// Payment Modal Component with Stripe Integration
function PaymentModal({
  project,
  onPaymentSuccess,
  onClose
}: {
  project: Project
  onPaymentSuccess: (payment: Omit<Payment, 'id'>) => void
  onClose: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [amount, setAmount] = useState(0)

  const total = project.charges.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
  const paidAmount = project.paidAmount || 0
  const remaining = total - paidAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    if (amount <= 0 || amount > remaining) {
      setError(`Please enter an amount between $1 and $${remaining.toLocaleString()}`)
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'usd',
          description: `Payment for ${project.name}`
        }),
      })

      const { clientSecret, error: backendError } = await response.json()

      if (backendError) {
        setError(backendError)
        setProcessing(false)
        return
      }

      const cardElement = elements.getElement(CardElement)

      if (!cardElement) {
        setError('Card element not found')
        setProcessing(false)
        return
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      )

      if (stripeError) {
        setError(stripeError.message || 'Payment failed')
        setProcessing(false)
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onPaymentSuccess({
          projectId: project.id,
          amount: amount,
          status: 'Completed',
          paymentDate: new Date().toISOString(),
          paymentMethod: 'Credit Card'
        })
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Process Payment</CardTitle>
              <CardDescription>{project.name}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Project Value:</span>
              <span className="font-medium">${total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Already Paid:</span>
              <span className="font-medium">${paidAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Remaining Balance:</span>
              <span className="text-red-600">${remaining.toLocaleString()}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="amount">Payment Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={remaining}
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                placeholder="Enter amount"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum: ${remaining.toLocaleString()}
              </p>
            </div>

            <div>
              <Label>Card Details</Label>
              <div className="mt-2 p-3 border rounded-md">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                      invalid: {
                        color: '#9e2146',
                      },
                    },
                  }}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={!stripe || processing} className="flex-1">
                {processing ? 'Processing...' : `Pay $${amount.toLocaleString()}`}
              </Button>
            </div>
          </form>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800">
              <strong>Test Card:</strong> 4242 4242 4242 4242 | Exp: Any future date | CVC: Any 3 digits
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// END OF FILE