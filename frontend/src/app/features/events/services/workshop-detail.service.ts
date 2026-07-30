import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { WorkshopDetail } from '../models/workshop-detail.model';
// import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WorkshopDetailService {
  // private readonly baseUrl = `${environment.apiBaseUrl}/events`;

  constructor(private http: HttpClient) {}

  getWorkshopById(id: string): Observable<WorkshopDetail> {
    // TODO: replace with the real call once EventService's GET /events/:id is live:
    // return this.http.get<WorkshopDetail>(`${this.baseUrl}/${id}`);
    const workshop = this.mockWorkshops[id];

    if (!workshop) {
      throw new Error(`Workshop detail not found for id: ${id}`);
    }

    return of(workshop);
  }

  /**
   * Add a method to expose the full dataset
   * Expose the full workshop dataset so other services (e.g., EventService)
   * can deliver lighter-weight views (like list/card data) from a single source of truth 
   * instead of maintaining a second mockdata. 
   */

  getAllWorkshop(): Observable<WorkshopDetail[]> {
    return of (Object.values(this.mockWorkshops));
  }

  private readonly mockWorkshops: Record<string, WorkshopDetail> = {
    'wk-1': {
      id: 'wk-1',
      title: 'Global Supply Chain Resilience 2024',
      status: 'published',
      heroImageUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80',
      dateLabel: 'Oct 24, 2024',
      timeLabel: '10:00 AM (2h)',
      location: 'Main Hall, HQ-12',
      format: 'in-person',
      difficulty: 'intermediate',
      seatsFilled: 42,
      seatsTotal: 50,
      speaker: {
        name: 'Dr. Elena Rodriguez',
        title: 'Head of Global Logistics',
        bio: "Dr. Rodriguez is a distinguished expert with over 20 years of experience in optimizing international logistics chains. Her work focuses on integrating AI-driven predictive modeling to mitigate risks in global trade routes. She has pioneered resilience frameworks for SCC's top enterprise partners.",
        avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=500&h=500&q=80',
      },
      description:
        'In an era of increasing global volatility, the ability to build and maintain a resilient supply chain is no longer just a competitive advantage — it is a survival necessity. This intensive 2-hour workshop will deconstruct the current landscape of global logistics and provide actionable strategies for risk management.',
      learningObjectives: [
        'Identify and quantify high-probability disruptors in the current logistics cycle.',
        "Develop a 'Dual-Source' strategy framework for critical component procurement.",
        'Implement real-time visibility tools across multi-tier supplier networks.',
      ],
      prerequisites:
        "Participants should have a foundational understanding of SCC's core logistical platform and at least 3 years of experience in supply chain management or procurement roles.",
    },
    'wk-2': {
      id: 'wk-2',
      title: 'Predictive Analytics for Warehousing',
      status: 'published',
      heroImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop',
      dateLabel: 'Oct 26, 2024',
      timeLabel: '02:00 PM (90m)',
      location: 'Microsoft Teams Link',
      format: 'virtual',
      difficulty: 'advanced',
      seatsFilled: 156,
      seatsTotal: 200,
      speaker: {
        name: 'Marcus Chen',
        title: 'Principal Data Strategist',
        bio: 'Marcus helps operations teams turn warehouse telemetry into planning decisions using practical analytics pipelines and forecasting models.',
        avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=500&h=500&q=80',
      },
      description:
        'Learn how to turn warehouse events, throughput metrics, and historical demand into actionable predictions for staffing and storage planning.',
      learningObjectives: [
        'Build a forecasting workflow from operational data.',
        'Spot demand anomalies before they affect capacity.',
        'Communicate predictions clearly to non-technical stakeholders.',
      ],
      prerequisites: 'Basic spreadsheet literacy and familiarity with warehouse operations concepts.',
    },
    'wk-3': {
      id: 'wk-3',
      title: 'Change Management in Logistics',
      status: 'published',
      heroImageUrl: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop',
      dateLabel: 'Nov 02, 2024',
      timeLabel: '09:00 AM (2h)',
      location: 'Conference Center B',
      format: 'in-person',
      difficulty: 'beginner',
      seatsFilled: 12,
      seatsTotal: 25,
      speaker: {
        name: 'Robert Sterling',
        title: 'Organizational Transformation Lead',
        bio: 'Robert designs change programs that keep logistics teams aligned while new systems, process changes, and reporting structures roll out.',
        avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=500&h=500&q=80',
      },
      description:
        'A practical session on guiding teams through process changes without losing momentum, clarity, or trust across logistics operations.',
      learningObjectives: [
        'Recognize common failure points during change rollouts.',
        'Use communication checkpoints to reduce resistance.',
        'Plan adoption milestones for operational teams.',
      ],
      prerequisites: 'No formal prerequisites. Helpful for first-time team leads and supervisors.',
    },
    'wk-4': {
      id: 'wk-4',
      title: 'Lean Warehouse Operations Workshop',
      status: 'published',
      heroImageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&',
      dateLabel: 'Nov 05, 2024',
      timeLabel: '11:00 AM (2h)',
      location: 'Logistics Hub C',
      format: 'in-person',
      difficulty: 'intermediate',
      seatsFilled: 22,
      seatsTotal: 30,
      speaker: {
        name: 'David Wu',
        title: 'Warehouse Optimization Specialist',
        bio: 'David focuses on lean flow design, throughput improvement, and practical waste reduction in warehouse environments.',
        avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=500&h=500&q=80',
      },
      description:
        'A hands-on workshop covering lean techniques that help warehouses reduce waste, improve movement, and increase operational clarity.',
      learningObjectives: [
        'Map bottlenecks in warehouse movement.',
        'Apply lean techniques to daily operations.',
        'Measure small improvements that scale over time.',
      ],
      prerequisites: 'Recommended for team leads and supervisors with basic warehouse experience.',
    },
    'wk-5': {
      id: 'wk-5',
      title: 'AI-Driven Forecasting for Operations',
      status: 'published',
      heroImageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop',
      dateLabel: 'Nov 07, 2024',
      timeLabel: '01:00 PM (90m)',
      location: 'Innovation Lab A',
      format: 'virtual',
      difficulty: 'advanced',
      seatsFilled: 88,
      seatsTotal: 100,
      speaker: {
        name: 'Priya Shah',
        title: 'Applied AI Solutions Architect',
        bio: 'Priya builds AI systems that help operational teams forecast demand, allocation, and risk with practical business outcomes.',
        avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=500&h=500&q=80',
      },
      description:
        'Discover how AI models can support operational forecasting while staying understandable, auditable, and useful for business users.',
      learningObjectives: [
        'Choose features that matter for forecasting.',
        'Understand the trade-off between speed and accuracy.',
        'Present AI results in an operations-friendly way.',
      ],
      prerequisites: 'Intermediate analytics knowledge is recommended.',
    },
    'wk-6': {
      id: 'wk-6',
      title: 'Sustainable Logistics in Practice',
      status: 'published',
      heroImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop',
      dateLabel: 'Nov 09, 2024',
      timeLabel: '03:30 PM (2h)',
      location: 'Green Room, HQ-08',
      format: 'in-person',
      difficulty: 'beginner',
      seatsFilled: 18,
      seatsTotal: 24,
      speaker: {
        name: 'Alicia Nguyen',
        title: 'Sustainability Program Manager',
        bio: 'Alicia helps teams design logistics programs that are both environmentally responsible and operationally practical.',
        avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=500&h=500&q=80',
      },
      description:
        'An introductory session on improving logistics sustainability without sacrificing reliability or service quality.',
      learningObjectives: [
        'Identify easy sustainability wins in logistics.',
        'Balance environmental and operational trade-offs.',
        'Track impact with simple metrics.',
      ],
      prerequisites: 'Open to all employees.',
    },
    'wk-7': {
      id: 'wk-7',
      title: 'Compliance Essentials for Modern Teams',
      status: 'published',
      heroImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop',
      dateLabel: 'Nov 12, 2024',
      timeLabel: '10:30 AM (2h)',
      location: 'Boardroom 3',
      format: 'in-person',
      difficulty: 'intermediate',
      seatsFilled: 31,
      seatsTotal: 40,
      speaker: {
        name: 'James Patel',
        title: 'Corporate Governance Advisor',
        bio: 'James supports teams in understanding policy, audit readiness, and the day-to-day habits that keep compliance strong.',
        avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=500&h=500&q=80',
      },
      description:
        'A practical guide to compliance basics for teams that need a clear, usable framework instead of legal jargon.',
      learningObjectives: [
        'Understand the role of compliance in internal teams.',
        'Recognize common audit risks.',
        'Build habits that reduce policy drift.',
      ],
      prerequisites: 'Helpful for managers and coordinators.',
    },
    'wk-8': {
      id: 'wk-8',
      title: 'Designing Better Warehouse Workflows',
      status: 'published',
      heroImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop',
      dateLabel: 'Nov 14, 2024',
      timeLabel: '04:00 PM (75m)',
      location: 'Teams Live Session',
      format: 'virtual',
      difficulty: 'beginner',
      seatsFilled: 63,
      seatsTotal: 80,
      speaker: {
        name: 'Nina Alvarez',
        title: 'Process Design Consultant',
        bio: 'Nina helps teams simplify workflows so they can move work faster with fewer handoff errors.',
        avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=500&h=500&q=80',
      },
      description:
        'A workshop on improving warehouse flow by reducing friction, clarifying steps, and making handoffs easier to follow.',
      learningObjectives: [
        'Spot unnecessary steps in common workflows.',
        'Reduce handoff friction between teams.',
        'Use simple diagrams to redesign processes.',
      ],
      prerequisites: 'No prerequisites.',
    },
    'wk-9': {
      id: 'wk-9',
      title: 'Leading Through Change in Logistics',
      status: 'published',
      heroImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop',
      dateLabel: 'Nov 17, 2024',
      timeLabel: '09:00 AM (2h)',
      location: 'Training Center D',
      format: 'in-person',
      difficulty: 'advanced',
      seatsFilled: 25,
      seatsTotal: 35,
      speaker: {
        name: 'Sophia Kim',
        title: 'Leadership Development Coach',
        bio: 'Sophia supports leaders who need to guide teams through ambiguity, growth, and operational change.',
        avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=500&h=500&q=80',
      },
      description:
        'This session helps leaders build trust, communicate clearly, and keep teams aligned during periods of disruption.',
      learningObjectives: [
        'Lead calmly when priorities shift.',
        'Use communication plans that reduce uncertainty.',
        'Keep teams focused during transitions.',
      ],
      prerequisites: 'Best for people managers and project leads.',
    },
    'wk-10': {
      id: 'wk-10',
      title: 'Mastering Data Storytelling for Teams',
      status: 'published',
      heroImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop',
      dateLabel: 'Nov 20, 2024',
      timeLabel: '11:45 AM (90m)',
      location: 'Remote Studio',
      format: 'virtual',
      difficulty: 'intermediate',
      seatsFilled: 44,
      seatsTotal: 60,
      speaker: {
        name: 'Daniel Brooks',
        title: 'Analytics Communication Lead',
        bio: 'Daniel teaches teams how to translate data into clear messages that help people act with confidence.',
        avatarUrl: 'assets/images/speakers/daniel-brooks.jpg',
      },
      description:
        'Learn how to turn analysis into a story that helps people understand the why behind the numbers.',
      learningObjectives: [
        'Structure a data story for decision-makers.',
        'Reduce clutter in charts and slides.',
        'Connect metrics to a business action.',
      ],
      prerequisites: 'Basic familiarity with metrics and reporting.',
    },
    'wk-11': {
      id: 'wk-11',
      title: 'Operational Excellence Bootcamp',
      status: 'published',
      heroImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop',
      dateLabel: 'Nov 22, 2024',
      timeLabel: '02:00 PM (2h)',
      location: 'Ops Hub',
      format: 'in-person',
      difficulty: 'intermediate',
      seatsFilled: 70,
      seatsTotal: 90,
      speaker: {
        name: 'Mina Okafor',
        title: 'Operations Excellence Consultant',
        bio: 'Mina works with teams to reduce waste, improve flow, and strengthen operating routines.',
        avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=500&h=500&q=80',
      },
      description:
        'A bootcamp for teams that want to improve daily execution, spot inefficiencies, and build steadier operating habits.',
      learningObjectives: [
        'Identify the biggest operational waste points.',
        'Design routines that support consistency.',
        'Track improvements with simple scorecards.',
      ],
      prerequisites: 'Useful for supervisors and process owners.',
    },
    'wk-12': {
      id: 'wk-12',
      title: 'Future of Supply Chain Automation',
      status: 'published',
      heroImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop',
      dateLabel: 'Nov 25, 2024',
      timeLabel: '08:30 AM (2h)',
      location: 'Innovation Hall',
      format: 'in-person',
      difficulty: 'advanced',
      seatsFilled: 57,
      seatsTotal: 70,
      speaker: {
        name: 'Liam Brooks',
        title: 'Automation Strategy Lead',
        bio: 'Liam helps teams identify where automation can reduce manual work and improve resilience.',
        avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=500&h=500&q=80',
      },
      description:
        'Explore the next wave of automation tools and how they can reshape logistics planning, execution, and reporting.',
      learningObjectives: [
        'Evaluate where automation creates the most value.',
        'Compare human and system responsibilities.',
        'Plan small automation pilots that can scale.',
      ],
      prerequisites: 'Recommended for operations, product, and engineering stakeholders.',
    },
  };
}
