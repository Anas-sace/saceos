# Remix of Remix of Remix of SACE Workforce Hub

this is our logo and colour combination

Build a responsive, production-ready internal workforce portal named “SACE Portal” for managing employees, attendance, assigned work, leave, leads, messages, support tickets, reports, and employee recognition.

The product must support three roles:

Super Admin

Admin

Team Member

Use a clean, modern, premium internal-tool interface. The visual style should feel professional and calm: off-white background, dark navy sidebar, coral primary action colour, subtle purple/teal accents, rounded cards, clear typography, responsive layout, and accessible contrast.

Core product goal

SACE Portal should let a company manage daily employee activity from one place. Team members must punch in and punch out, complete assigned tasks, submit proof of completed work, request leaves, view attendance and leaderboard recognition, access shared leads, message colleagues, and create support tickets.

Admins and Super Admins should manage users, assign tasks, approve leaves, upload leads, view tickets, generate employee progress reports, and manage recognition. The Super Admin has full access and can manage Admin accounts.

Authentication and onboarding

Create secure authentication with username/email and password.

When Super Admin or Admin creates an employee account, they must define:

Full name

Username

Email

Password or temporary password

Designation

Department/team

Role: Team Member or Admin

Reporting Admin

Account status: Active or Inactive

On the first successful login, every Team Member must be required to create a “Daily Vision” or motivational quote. This quote should always appear prominently on their dashboard and be editable later.

Example:

“Design with purpose. Lead with kindness.”

After login, route users to the correct dashboard based on their role.

Role permissions

Super Admin

Super Admin has complete access to the system.

Permissions:

Create, edit, deactivate, and delete Admin and Team Member accounts

Assign, reassign, edit, close, and review tasks

Approve or reject all leave requests

Upload, edit, lock, unlock, hide, and publish lead data

View all attendance records

View all employee reports

Generate monthly or custom-date progress reports

View and manage all support tickets

Create employee recognition and leaderboard awards

Configure designations, departments, leave policies, and work settings

View platform-wide analytics

Admin

Admin has management permissions, except they cannot manage Super Admin accounts or system-wide configuration.

Permissions:

Create and manage Team Member accounts if allowed by Super Admin

Assign tasks to team members

Review submitted task proof

Approve or reject leave requests for assigned team members

Upload leads

Choose whether leads are private or public

Choose whether leads are locked or editable

View team attendance

Generate employee progress reports

View all support tickets

Update ticket status

Add employee recognition and leaderboard tags if granted permission

Use internal messaging

Team Member

Permissions:

View and edit their own profile and daily vision

Punch in and punch out

View their assigned tasks

Submit task completion proof

View their own attendance calendar and working hours

Apply for casual leave or sick leave

View leave request status

View leads only when made public by Admin/Super Admin

Message other members, Admins, and Super Admin

Create support tickets

View only their own support tickets and ticket status

View leaderboard and recognition awards

Cannot access other employees’ attendance, tickets, reports, or private leads

Dashboard

Create a different dashboard experience for Team Members and Admins.

Team Member dashboard

Show:

Greeting with employee name

Date and current time

Daily Vision / motivational quote

Punch in / punch out module

Current work status

Live work timer after punch in

Total hours worked today

Monthly total working hours

Attendance percentage for the current month

Tasks completed this month

Active assigned tasks

Pending leave requests

Recent messages

Recent support ticket updates

Leaderboard highlights

Quick actions:

Punch in / Punch out

Open tasks

Apply for leave

Create support ticket

Send message

Admin dashboard

Show:

Team attendance overview

Number of employees punched in today

Number of employees absent, on leave, and on week-off

Pending leave requests

Tasks assigned, in progress, completed, and overdue

Task proof waiting for review

Ticket metrics:

Created

In progress

Completed

Closed

Recent employee activity

Quick links to create account, assign task, approve leave, upload leads, generate report, and create recognition

Attendance and punch-in/punch-out system

Build a complete time-attendance module.

Punch in

When a Team Member clicks Punch In:

Save exact date and timestamp

Mark attendance status as Present

Start a live timer

Record work session start time

Show visual indicator that employee is currently working

Prevent duplicate punch-ins on the same session

Punch out

When a Team Member clicks Punch Out:

Check whether they have submitted proof for at least one completed task on that same working day

If no proof has been submitted, block punch out and show this message:

“You must submit proof for at least one completed task before punching out.”

Provide a direct link to the task section

If proof exists, allow punch out

Save exact punch-out timestamp

Calculate total working hours

Save total working hours in attendance record

Stop live timer

Mark the day as complete

Support multiple break sessions later, but create the initial product with a simple punch-in and punch-out flow.

Attendance calendar

Create an individual calendar view for every Team Member.

Each calendar date should display:

Attendance status

Punch-in time

Punch-out time

Total working hours

Number of tasks submitted

Leave label if applicable

Weekend label for Saturday and Sunday

Absent label if no attendance and no approved leave exists

Use colour-coded statuses:

Present: green

Approved casual leave: purple

Approved sick leave: blue

Absent: red

Week off: muted grey

Current day: highlighted border or background

On clicking a date, open a detail drawer or modal with:

Date

Punch-in time

Punch-out time

Total hours

Submitted tasks

Task proof links/files

Attendance status

Leave details if applicable

Saturday and Sunday must automatically show as “Week Off.” They should not be counted as absence.

Task management

Admins and Super Admins must be able to create and assign tasks.

Task fields

Each task should include:

Task title

Detailed description

Assigned employee

Assigned by

Priority: Low, Medium, High, Urgent

Status: Assigned, In Progress, Submitted, Revision Requested, Approved, Completed, Overdue

Start date

Due date and due time

Optional attachments

Required proof type setting:

Image

File

Link

Any proof type

Task comments/activity log

Team Member task experience

Team Members should see:

Active tasks

Completed tasks

Overdue tasks

Due dates

Priority labels

Assigned-by information

Task description

Attached files or links

Status and progress

When completing a task, the member must be able to submit proof in one or more formats:

Image upload

File upload

URL/link

Text note

Proof submission should include:

Proof type

File/image/link

Completion note

Submitted timestamp

Optional comments

After proof submission:

Task status becomes Submitted

Admin/Super Admin receives notification

Task is eligible to satisfy the daily punch-out rule

Admin may approve the task or request revisions

Admin task management

Admins/Super Admins can:

Assign tasks

Reassign tasks

Edit due date, priority, or description

View proof

Approve task

Request revision

Mark task complete

Close task

Filter tasks by employee, status, priority, date, and overdue state

Leave management

Create a leave request module with two types:

Casual Leave

Sick Leave

Team Member leave request

A Team Member can submit a leave request with:

Leave type

Start date

End date

Half day or full day option

Reason

Optional document upload for sick leave

Emergency contact optional field

After submission, the request status should be Pending.

The Team Member should be able to see:

Remaining casual leave balance

Remaining sick leave balance

Pending requests

Approved requests

Rejected requests

Admin comments

Admin leave approval

Admins and Super Admins can:

Review pending leave requests

Approve leave

Reject leave

Add comments

View employee leave balance

Filter requests by type, employee, date range, and status

When leave is approved:

Update leave request status to Approved

Mark the attendance calendar with the appropriate leave type

Do not mark the employee absent

Notify the Team Member

Leads management

Create a leads section for Super Admins and Admins.

Admins/Super Admins must be able to upload lead data in common formats:

CSV

XLSX

XLS

PDF

DOCX

Image

Text file

External link

For each uploaded lead dataset, provide these required choices:

Visibility

Private: visible only to the uploader, Admins, and Super Admin

Public: visible to all Team Members

Edit setting

Locked: users can view but cannot edit

Open for edits: authorised users can edit, add notes, and update records

Lead dataset fields should include:

Dataset name

Description

File/link

Uploaded by

Upload date

Visibility

Edit status

Number of records, if applicable

Tags

Activity history

Team Members should only see public lead data. They should not see private uploads.

Internal messaging

Build a private internal messaging system.

Requirements:

One-to-one messages between all users

Group conversations for teams/departments

Admin announcement channel

Message timestamps

Read/unread status

Search conversations

File and image attachments

Link preview where possible

Notifications for new messages

Team Members may message other Team Members, Admins, and Super Admins.

Admins can create announcements visible to selected teams or all employees.

Support ticketing

Create a ticketing system for employee support requests.

Team Member ticket flow

A Team Member can create a ticket with:

Subject

Category:

Platform and access

HR and leave

Work allocation

IT issue

Payroll query

Other

Description

Priority

Optional file attachment

After creating a ticket:

Generate a unique ticket ID, for example: SACE-184

Show ticket status to the creator

Allow the creator to add comments

Allow the creator to close their ticket only after resolution, if permitted

Team Members can only see tickets they created.

Admin ticket flow

Only Admins and Super Admins can see all tickets.

They should see ticket analytics:

Total tickets created

Open tickets

In-progress tickets

Completed tickets

Closed tickets

Overdue tickets

Tickets by category

Tickets by employee

Ticket statuses:

Created

Open

In Progress

Waiting for Employee

Completed

Closed

Admins can:

Assign ticket owner

Change ticket status

Add internal notes visible only to Admins

Add public replies visible to the ticket creator

Resolve or close ticket

Filter by status, category, employee, owner, and date

Employee progress reports

Reports must be visible only to Admins and Super Admins.

Create a monthly employee progress report generator.

Report fields:

Employee name

Designation

Department

Reporting period

Attendance percentage

Present days

Leave days

Absent days

Total working hours

Average working hours per day

Tasks assigned

Tasks submitted

Tasks approved

Tasks pending

Overdue tasks

Task completion percentage

Leave summary

Ticket summary, if relevant

Admin performance summary

Strengths

Areas for improvement

Recognition received

Overall rating optional

Allow report export as:

PDF

CSV or XLSX

Print-friendly view

Include filters for:

Employee

Department

Month

Date range

Admin/reporting manager

Leaderboard and recognition

Create a leaderboard section visible to all users.

Only Super Admin should have full control of employee recognition. Admin access can be optional and controlled by Super Admin permissions.

Recognition types:

Employee of the Month

Star Employee

Most Improved

Team Player

Best Attendance

Highest Task Completion

Client Champion

Innovation Award

Custom recognition tag

Each recognition record should include:

Employee

Award type/tag

Month or date

Recognition reason

Nominated by

Optional photo/avatar

Optional highlight quote

Leaderboard should show:

Featured Employee of the Month

Top ranked employees

Recognition tags

Employee designation

Department

Short recognition note

Team Members can only view the leaderboard; they cannot create, edit, or remove awards.

Notifications

Create a notification system for:

New task assignment

Task due soon

Task overdue

Task proof approved

Task revision requested

Leave request approved or rejected

New message

Ticket status update

New recognition

Lead data published to the team

Admin announcement

Notifications should support:

Unread indicator

Mark as read

Notification centre

Click through to relevant page

Data models

Include at minimum these entities:

User

Role

Department

AttendanceRecord

WorkSession

Task

TaskProof

TaskComment

LeaveRequest

LeaveBalance

LeadDataset

LeadRecord

Conversation

Message

Ticket

TicketComment

TicketInternalNote

ProgressReport

RecognitionAward

Notification

AuditLog

Add audit logs for important Admin actions such as:

Account created or deactivated

Task assigned or edited

Leave approved/rejected

Lead dataset visibility changed

Lead dataset locked/unlocked

Ticket status changed

Recognition published

Navigation

Create a left sidebar navigation.

For Team Members:

Overview

My Tasks

Attendance

Leave Requests

Leads

Messages

Support Tickets

Leaderboard

Profile / Settings

Log Out

For Admins:

Overview

Tasks

Attendance

Leave Requests

Leads

Messages

Support Tickets

Leaderboard

Team and Accounts

Progress Reports

Settings

Log Out

For Super Admins:

All Admin navigation items

Admin Management

System Settings

Roles and Permissions

Audit Logs

Important business rules

A Team Member cannot punch out unless at least one task proof is submitted for the current working day.

A submitted proof can be an image, file, link, or text note.

Saturday and Sunday are always marked as Week Off by default.

A weekday without punch-in and without approved leave should display as Absent after the day is complete.

Only approved leave should update the attendance calendar.

Casual and Sick Leave balances must be tracked separately.

Team Members can view only their own attendance, tasks, leave requests, reports available to them, and tickets.

Team Members can see only public lead data.

Only Admins and Super Admins can view all support tickets.

Only Admins and Super Admins can generate employee progress reports.

Only Super Admin can fully manage the leaderboard and recognition awards.

Any Admin or Super Admin task assignment must immediately appear in the assigned employee’s My Tasks section.

Every important action should create an activity log and notification where relevant.

Ensure all pages handle empty, loading, error, and no-access states.

Technical expectations

Build the application as a responsive web application with:

Secure authentication

Role-based access control

Responsive desktop, tablet, and mobile layouts

Accessible forms and keyboard navigation

Server-side authorisation checks for every protected operation

File upload validation

Secure document storage

Timestamp handling using the organisation timezone

Search, sorting, filters, and pagination where required

Dashboard charts for Admin analytics

Reusable UI components

Clear empty states and validation messages

Suggested stack:

Frontend: React or Next.js with TypeScript

UI: Tailwind CSS or a component library with custom design system

Backend: Next.js API routes, Node.js, or equivalent

Database: PostgreSQL

ORM: Prisma or equivalent

Authentication: secure session/JWT-based authentication

File storage: secure object storage

Reporting: PDF generation service/library

Acceptance criteria

The product is complete when:

A Super Admin can create an Admin and a Team Member account.

A Team Member can log in, save a daily vision, punch in, receive a task, submit proof, and successfully punch out.

Punch out is blocked before proof submission.

An Admin can assign tasks and approve/reject proof.

A Team Member can apply for casual or sick leave.

An Admin can approve leave and the calendar updates correctly.

Attendance calendar displays present days, working hours, submitted task count, weekends, approved leave, and absent days.

An Admin can upload a lead file, choose public/private visibility, and choose locked/editable access.

Public leads are visible to Team Members; private leads are not.

Users can exchange messages.

Team Members can create tickets, while only Admins/Super Admins can view all tickets and ticket analytics.

Admins can generate monthly employee reports with attendance, hours, tasks, and written summary.

Super Admin can publish employee recognition, which appears on the public leaderboard.

Every role sees only the pages and data they are authorised to access.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://sacehq.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2e4345bc-22c7-4596-9cc6-643f02329355).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
