import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './DisclaimerMarquee.css'

export default function DisclaimerMarquee() {
  const [disclaimers, setDisclaimers] = useState([])

  useEffect(() => {
    loadActiveDisclaimers()

    // Subscribe to changes
    const subscription = supabase
      .channel('disclaimers-public')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'disclaimers',
        },
        () => {
          loadActiveDisclaimers()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadActiveDisclaimers = async () => {
    try {
      const { data, error } = await supabase
        .from('disclaimers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDisclaimers(data || [])
    } catch (err) {
      console.error('Error loading disclaimers:', err)
    }
  }

  if (disclaimers.length === 0) return null

  // Create content string with proper spacing
  const content = disclaimers.map(d => `📢 ${d.text}`).join('   •   ')

  return (
    <div className="disclaimer-marquee-container">
      <div className="disclaimer-marquee">
        <div className="disclaimer-scroll">
          {[...Array(8)].map((_, i) => (
            <span key={i} className="disclaimer-content">{content}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
