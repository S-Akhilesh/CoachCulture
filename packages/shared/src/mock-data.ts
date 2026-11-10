import type { LucideIcon } from "lucide-react"
import {
  Apple,
  Camera,
  CheckCircle2,
  ChartNoAxesCombined,
  Dumbbell,
  LayoutDashboard,
  MessageSquare,
  Settings,
  TrendingUp,
  Users,
  UtensilsCrossed,
} from "lucide-react"

export const coach = {
  name: "Alex Rivera",
  firstName: "Alex",
  role: "Head Coach",
  email: "alex@formfit.app",
  initials: "AR",
}

export type KpiCard = {
  id: string
  title: string
  value: number
  trend: string
  trendUp: boolean
  icon: LucideIcon
}

export const kpiCards: KpiCard[] = [
  {
    id: "total-clients",
    title: "Total Clients",
    value: 48,
    trend: "+4 this month",
    trendUp: true,
    icon: Users,
  },
  {
    id: "active-clients",
    title: "Active Clients",
    value: 42,
    trend: "+2 this week",
    trendUp: true,
    icon: TrendingUp,
  },
  {
    id: "workout-plans",
    title: "Workout Plans",
    value: 36,
    trend: "+5 this month",
    trendUp: true,
    icon: Dumbbell,
  },
  {
    id: "diet-plans",
    title: "Diet Plans",
    value: 28,
    trend: "+3 this month",
    trendUp: true,
    icon: Apple,
  },
]

export type WorkoutActivity = {
  day: string
  completed: number
}

export const weeklyWorkoutActivity: WorkoutActivity[] = [
  { day: "Mon", completed: 18 },
  { day: "Tue", completed: 24 },
  { day: "Wed", completed: 21 },
  { day: "Thu", completed: 27 },
  { day: "Fri", completed: 22 },
  { day: "Sat", completed: 15 },
  { day: "Sun", completed: 12 },
]

export type ScheduleSession = {
  id: string
  clientName: string
  clientInitials: string
  time: string
  type: string
  duration: string
}

export const todaysSchedule: ScheduleSession[] = [
  {
    id: "1",
    clientName: "Maya Chen",
    clientInitials: "MC",
    time: "9:00 AM",
    type: "Strength Training",
    duration: "60 min",
  },
  {
    id: "2",
    clientName: "Jordan Blake",
    clientInitials: "JB",
    time: "11:30 AM",
    type: "HIIT Session",
    duration: "45 min",
  },
  {
    id: "3",
    clientName: "Priya Patel",
    clientInitials: "PP",
    time: "2:00 PM",
    type: "Form Check",
    duration: "30 min",
  },
  {
    id: "4",
    clientName: "Sam Okonkwo",
    clientInitials: "SO",
    time: "4:30 PM",
    type: "Nutrition Review",
    duration: "45 min",
  },
]

export type ActivityItem = {
  id: string
  clientName: string
  description: string
  timeAgo: string
  icon: LucideIcon
  tone: "green" | "blue" | "amber" | "slate"
}

export const recentActivity: ActivityItem[] = [
  {
    id: "1",
    clientName: "Maya Chen",
    description: "Completed Upper Body Strength A",
    timeAgo: "12 min ago",
    icon: CheckCircle2,
    tone: "green",
  },
  {
    id: "2",
    clientName: "Jordan Blake",
    description: "Diet plan updated to Cut Phase Week 3",
    timeAgo: "45 min ago",
    icon: UtensilsCrossed,
    tone: "blue",
  },
  {
    id: "3",
    clientName: "Priya Patel",
    description: "Uploaded progress photos",
    timeAgo: "1 hr ago",
    icon: Camera,
    tone: "amber",
  },
  {
    id: "4",
    clientName: "Sam Okonkwo",
    description: "Messaged about tomorrow’s session",
    timeAgo: "2 hrs ago",
    icon: MessageSquare,
    tone: "slate",
  },
  {
    id: "5",
    clientName: "Elena Rossi",
    description: "Completed Lower Body Hypertrophy B",
    timeAgo: "3 hrs ago",
    icon: CheckCircle2,
    tone: "green",
  },
]

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Workouts", href: "/workouts", icon: Dumbbell },
  { label: "Diet Plans", href: "/diet-plans", icon: Apple },
  { label: "Progress", href: "#progress", icon: ChartNoAxesCombined },
  { label: "Settings", href: "#settings", icon: Settings },
]
