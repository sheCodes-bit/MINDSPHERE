import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/sections/HeroSection'
import { AboutSection } from '@/components/sections/AboutSection'
import { SubjectsSection } from '@/components/sections/SubjectsSection'
import { RoundsSection } from '@/components/sections/RoundsSection'
import { RulesSection } from '@/components/sections/RulesSection'
import { RegistrationCTASection } from '@/components/sections/RegistrationCTASection'
import { FAQSection } from '@/components/sections/FAQSection'
import { AnnouncementsSection } from '@/components/sections/AnnouncementsSection'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch public data server-side
  const [subjectsResult, announcementsResult, settingsResult] = await Promise.all([
    supabase
      .from('subjects')
      .select('*')
      .eq('is_active', true)
      .order('display_order'),
    supabase
      .from('announcements')
      .select('id, title, body, is_pinned, published_at, created_at')
      .eq('status', 'published')
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(5),
    supabase
      .from('competition_settings')
      .select('key, value')
      .eq('is_public', true),
  ])

  const subjects = subjectsResult.data ?? []
  const announcements = announcementsResult.data ?? []
  const settingsMap = Object.fromEntries(
    (settingsResult.data ?? []).map(s => [s.key, s.value])
  )

  return (
    <>
      <Navbar />
      <main id="main-content">
        <HeroSection settings={settingsMap} />
        <AboutSection />
        <SubjectsSection subjects={subjects} />
        <RoundsSection />
        <RulesSection />
        <AnnouncementsSection announcements={announcements} />
        <RegistrationCTASection settings={settingsMap} />
        <FAQSection />
      </main>
      <Footer />
    </>
  )
}
