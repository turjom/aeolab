'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'

const INDUSTRIES = [
  'Home Renovation/Remodeling',
  'Photography (Wedding, Event, Portrait)',
  'Real Estate Agent (US) / Property Agent (SG)',
  'Plumbing Services',
  'Consulting (Business, Marketing, IT)',
  'Web Design/Development',
  'HVAC Services (US) / Air Conditioning Services (SG)',
  'Landscaping/Lawn Care',
]

const COUNTRIES = ['United States', 'Singapore']

interface Business {
  id: string
  business_name: string
  industry: string
  location: string
  website_url: string | null
}

export default function SettingsPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Business form state
  const [businessName, setBusinessName] = useState('')
  const [industry, setIndustry] = useState('')
  const [country, setCountry] = useState('')
  const [location, setLocation] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')

  // Modal states
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Email change form
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')

  // Password change form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  async function loadData() {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setLoading(false)
        return
      }

      setUserEmail(user.email || '')

      // Get business
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (businessError || !businessData) {
        setLoading(false)
        return
      }

      setBusiness(businessData)
      setBusinessName(businessData.business_name)
      setIndustry(businessData.industry)
      
      // Determine country from location
      const isSingapore = businessData.location === 'Singapore'
      setCountry(isSingapore ? 'Singapore' : 'United States')
      setLocation(businessData.location)
      setWebsiteUrl(businessData.website_url || '')

      setLoading(false)
    } catch (err) {
      console.error('Error loading settings:', err)
      setLoading(false)
    }
  }

  const handleSaveBusiness = async () => {
    if (!business) return

    setSaving(true)
    try {
      let finalLocation = location.trim()
      if (country === 'Singapore') {
        finalLocation = 'Singapore'
      }

      const { error } = await supabase
        .from('businesses')
        .update({
          business_name: businessName.trim(),
          industry,
          location: finalLocation,
          website_url: websiteUrl.trim() || null,
        })
        .eq('id', business.id)

      if (error) {
        setToast({
          message: 'Failed to update business information',
          type: 'error',
        })
      } else {
        setToast({
          message: 'Business information updated successfully',
          type: 'success',
        })
        // Reload data
        loadData()
      }
    } catch (err) {
      setToast({
        message: 'An error occurred while saving',
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangeEmail = async () => {
    if (!newEmail || !emailPassword) {
      setToast({
        message: 'Please fill in all fields',
        type: 'error',
      })
      return
    }

    setSaving(true)
    try {
      // Verify password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: emailPassword,
      })

      if (signInError) {
        setToast({
          message: 'Incorrect password',
          type: 'error',
        })
        setSaving(false)
        return
      }

      // Update email
      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail,
      })

      if (updateError) {
        setToast({
          message: updateError.message || 'Failed to update email',
          type: 'error',
        })
      } else {
        setToast({
          message: 'Email updated successfully. Please check your new email for verification.',
          type: 'success',
        })
        setShowEmailModal(false)
        setNewEmail('')
        setEmailPassword('')
        loadData()
      }
    } catch (err) {
      setToast({
        message: 'An error occurred while updating email',
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setToast({
        message: 'Please fill in all fields',
        type: 'error',
      })
      return
    }

    if (newPassword.length < 6) {
      setToast({
        message: 'Password must be at least 6 characters',
        type: 'error',
      })
      return
    }

    if (newPassword !== confirmPassword) {
      setToast({
        message: 'New passwords do not match',
        type: 'error',
      })
      return
    }

    setSaving(true)
    try {
      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      })

      if (signInError) {
        setToast({
          message: 'Incorrect current password',
          type: 'error',
        })
        setSaving(false)
        return
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setToast({
          message: updateError.message || 'Failed to update password',
          type: 'error',
        })
      } else {
        setToast({
          message: 'Password updated successfully',
          type: 'success',
        })
        setShowPasswordModal(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err) {
      setToast({
        message: 'An error occurred while updating password',
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      setToast({
        message: 'Please type DELETE to confirm',
        type: 'error',
      })
      return
    }

    if (!business) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Delete all user data
      // Delete tracking results (via prompts)
      const { data: prompts } = await supabase
        .from('tracked_prompts')
        .select('id')
        .eq('business_id', business.id)

      if (prompts && prompts.length > 0) {
        const promptIds = prompts.map(p => p.id)
        await supabase
          .from('tracking_results')
          .delete()
          .in('prompt_id', promptIds)
      }

      // Delete tracked prompts
      await supabase
        .from('tracked_prompts')
        .delete()
        .eq('business_id', business.id)

      // Delete recommendations
      await supabase
        .from('recommendations')
        .delete()
        .eq('business_id', business.id)

      // Delete business
      await supabase
        .from('businesses')
        .delete()
        .eq('id', business.id)

      // Delete subscription
      await supabase
        .from('user_subscriptions')
        .delete()
        .eq('user_id', user.id)

      // Sign out
      await supabase.auth.signOut()
      
      // Redirect to login
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error('Error deleting account:', err)
      setToast({
        message: 'An error occurred while deleting account',
        type: 'error',
      })
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 text-red-900 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Account Settings</h1>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
            toast.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <span className="text-xl">{toast.type === 'success' ? '✓' : '✕'}</span>
          <p className="font-medium">{toast.message}</p>
        </div>
      )}

      {/* Business Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Business Information</CardTitle>
          <CardDescription>Update your business details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">
                Business Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="business_name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">
                Industry <span className="text-red-500">*</span>
              </Label>
              <Select value={industry} onValueChange={(value) => setIndustry(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">
                Country <span className="text-red-500">*</span>
              </Label>
              <Select
                value={country}
                onValueChange={(value) => {
                  setCountry(value)
                  if (value === 'Singapore') {
                    setLocation('Singapore')
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">
                Location <span className="text-red-500">*</span>
              </Label>
              <Input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required={country !== 'Singapore'}
                disabled={country === 'Singapore'}
                placeholder={
                  country === 'Singapore'
                    ? 'Singapore'
                    : country === 'United States'
                    ? 'City, State (e.g., Los Angeles, CA)'
                    : 'Enter your location'
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">
                Website URL <span className="text-gray-400 text-xs">(optional)</span>
              </Label>
              <Input
                id="website_url"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <Button
              type="button"
              onClick={handleSaveBusiness}
              disabled={saving}
              className="bg-red-900 hover:bg-red-800 text-white"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Account Settings</CardTitle>
          <CardDescription>Manage your account credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_email">Current Email</Label>
              <Input
                id="current_email"
                type="email"
                value={userEmail}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="flex gap-4">
              <Dialog
                open={showEmailModal}
                onOpenChange={(open) => {
                  setShowEmailModal(open)
                  if (!open) {
                    setNewEmail('')
                    setEmailPassword('')
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">Change Email</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Change Email</DialogTitle>
                    <DialogDescription>
                      Enter your new email and current password to update.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="new_email">New Email</Label>
                      <Input
                        id="new_email"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="new@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email_password">Current Password</Label>
                      <Input
                        id="email_password"
                        type="password"
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        placeholder="Enter your password"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowEmailModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleChangeEmail} disabled={saving}>
                      {saving ? 'Updating...' : 'Update Email'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog
                open={showPasswordModal}
                onOpenChange={(open) => {
                  setShowPasswordModal(open)
                  if (!open) {
                    setCurrentPassword('')
                    setNewPassword('')
                    setConfirmPassword('')
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">Change Password</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                      Enter your current password and choose a new one.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="current_password">Current Password</Label>
                      <Input
                        id="current_password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new_password">New Password</Label>
                      <Input
                        id="new_password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">Confirm New Password</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleChangePassword} disabled={saving}>
                      {saving ? 'Updating...' : 'Update Password'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone Section */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-red-600">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6">
            Once you delete your account, there is no going back. This will permanently delete all your data.
          </p>
          <Dialog
            open={showDeleteModal}
            onOpenChange={(open) => {
              setShowDeleteModal(open)
              if (!open) setDeleteConfirm('')
            }}
          >
            <DialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-red-600">Delete Account</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your account and all associated data.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="delete_confirm">
                    Type <span className="font-bold">DELETE</span> to confirm:
                  </Label>
                  <Input
                    id="delete_confirm"
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteConfirm('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={saving || deleteConfirm !== 'DELETE'}
                >
                  {saving ? 'Deleting...' : 'Delete Account'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

    </div>
  )
}
