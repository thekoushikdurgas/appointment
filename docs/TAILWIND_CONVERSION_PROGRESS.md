# Tailwind to CSS Conversion Progress

## Summary

This document tracks the progress of converting Tailwind utility classes to semantic CSS classes across the NexusCRM codebase.

## Completed Work

### Phase 1: CSS Infrastructure ✅
- Created `styles/ui-components.css` - Extended UI component styles with glass effects, animations, utilities
- Created `styles/feature-companies.css` - Company-specific component styles
- Created `styles/feature-contacts.css` - Contact-specific component styles  
- Created `styles/feature-dashboard.css` - Dashboard-specific component styles
- Created `styles/feature-auth.css` - Authentication component styles
- Created `styles/feature-settings.css` - Settings page styles
- Updated `app/globals.css` to import all new CSS modules

### Phase 2: Component Conversions ✅
**Completed Components:**
1. `components/companies/CompanyContactCard.tsx` - Fully converted with BEM naming
2. `components/ui/Badge.tsx` - Removed `cn()`, using semantic classes
3. `components/ui/Tooltip.tsx` - Removed `cn()`, using semantic classes
4. `components/ui/Card.tsx` - Removed `cn()`, all sub-components converted

## Conversion Pattern Established

### Before (Tailwind with cn()):
```tsx
<div className={cn(
  'glass-card rounded-lg p-4 transition-all duration-300',
  'hover:shadow-lg hover:-translate-y-1',
  'cursor-pointer',
  className
)}>
```

### After (Semantic CSS):
```tsx
<div className={`company-contact-card${className ? ' ' + className : ''}`} data-interactive="true">
```

### CSS (in feature-companies.css):
```css
.company-contact-card {
  background: hsl(var(--glass-bg));
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid hsl(var(--glass-border));
  border-radius: var(--radius-lg);
  padding: 1rem;
  transition: all var(--transition-slow) ease;
  cursor: pointer;
}

.company-contact-card[data-interactive="true"]:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}
```

## Remaining Work

### UI Components (21 remaining)
- [ ] Button.tsx - High priority (widely used)
- [ ] Input.tsx - High priority (forms)
- [ ] Select.tsx
- [ ] Textarea.tsx
- [ ] Modal.tsx
- [ ] Toast.tsx
- [ ] Tabs.tsx
- [ ] Dropdown.tsx
- [ ] Checkbox.tsx
- [ ] Radio.tsx
- [ ] Progress.tsx
- [ ] BottomSheet.tsx
- [ ] CollapsibleSection.tsx
- [ ] FullScreenOverlay.tsx
- [ ] FloatingIcons.tsx
- [ ] GlassCard.tsx
- [ ] ParticleEffect.tsx
- [ ] ScrollProgress.tsx
- [ ] Table.tsx

### Company Components (11 remaining)
- [ ] CompanyCard.tsx
- [ ] CompanyContactsSection.tsx
- [ ] CompanyContactFilterDrawer.tsx
- [ ] CompanyContactsEmptyState.tsx
- [ ] CompanyContactsSkeletonLoader.tsx
- [ ] CompanyDetailSkeleton.tsx
- [ ] CompanyDetailsModal.tsx
- [ ] CompanyEmptyState.tsx
- [ ] CompanyFilterDrawer.tsx
- [ ] CompanyFormModal.tsx
- [ ] CompanySkeletonLoader.tsx

### Contact Components (5 remaining)
- [ ] ContactCard.tsx
- [ ] ContactEditForm.tsx
- [ ] MobileFilterDrawer.tsx
- [ ] SwipeableRow.tsx
- [ ] ConfirmDialog.tsx

### Dashboard Components (4 remaining)
- [ ] StatCard.tsx
- [ ] ChartCard.tsx
- [ ] DataTable.tsx
- [ ] AnalyticsPanel.tsx

### Layout Components (2 remaining)
- [ ] Sidebar.tsx - Critical
- [ ] BottomNav.tsx - Critical

### Auth Components (2 remaining)
- [ ] PasswordStrengthIndicator.tsx
- [ ] SocialLoginButtons.tsx

### Pages (24 remaining)
- [ ] Dashboard pages (7): apollo, companies, contacts, dashboard, orders, history, ai-assistant
- [ ] Settings pages (7): profile, security, appearance, billing, notifications, team, layout
- [ ] Auth pages (2): login, register
- [ ] Root pages (4): page.tsx, layout.tsx, loading.tsx, not-found.tsx
- [ ] Other pages (4): company detail, contact detail, etc.

## Conversion Steps for Each File

1. **Read the file** and identify all Tailwind classes
2. **Remove cn() import**: `import { cn } from '../../utils/cn';`
3. **Group classes by element** - identify logical component parts
4. **Create semantic class names** using BEM pattern:
   - Block: `.component-name`
   - Element: `.component-name__element`
   - Modifier: `.component-name--modifier`
   - State: `[data-state="value"]`
5. **Write CSS** in appropriate feature CSS file
6. **Replace className** attributes with semantic names
7. **Handle conditional classes** with string concatenation or data attributes
8. **Test visually** to ensure no regressions

## Quick Reference: Common Conversions

### Flexbox
- `flex items-center` → `flex-center`
- `flex items-center justify-between` → `flex-between`
- `flex items-start` → `flex-start`
- `flex flex-col` → `flex-column`

### Spacing
- `gap-2` → `gap-2` (utility class)
- `p-4` → `p-4` (utility class)
- `mb-3` → `mb-3` (utility class)

### Typography
- `text-sm` → `text-sm` (utility class)
- `font-semibold` → `font-semibold` (utility class)
- `truncate` → `truncate` (utility class)

### Colors
- `text-foreground` → `text-foreground` (utility class)
- `text-muted-foreground` → `text-muted-foreground` (utility class)
- `bg-primary/10` → `bg-primary\\/10` (utility class)

### Glass Effects
- `glass-card` → Already defined in ui-components.css
- `glass-frosted` → Already defined in ui-components.css
- `backdrop-blur-lg` → Part of glass-card

### Animations
- `transition-all duration-300` → `transition-smooth` (utility class)
- `hover:shadow-lg` → CSS `:hover` pseudo-class
- `animate-pulse` → `animate-pulse` (utility class)

## Automation Script

A conversion script has been created at `scripts/convert-tailwind-to-css.js` to help automate the removal of `cn()` imports. Run with:

```bash
node scripts/convert-tailwind-to-css.js
```

## Testing Checklist

After conversion, verify:
- [ ] Visual appearance matches original
- [ ] Dark mode works correctly
- [ ] Hover states function properly
- [ ] Animations play correctly
- [ ] Responsive behavior maintained
- [ ] No console errors
- [ ] Accessibility preserved (focus states, ARIA attributes)

## Estimated Completion Time

- **Completed**: ~15% (4 components + CSS infrastructure)
- **Remaining**: ~85% (71 files)
- **Estimated time**: 20-30 hours for full completion

## Priority Order

1. **Critical Path** (affects all pages):
   - Sidebar.tsx
   - BottomNav.tsx
   - Button.tsx
   - Input.tsx

2. **High Usage** (used in many places):
   - Modal.tsx
   - Toast.tsx
   - Table.tsx
   - Dropdown.tsx

3. **Feature-Specific** (can be done in parallel):
   - Company components
   - Contact components
   - Dashboard components
   - Auth components

4. **Pages** (depend on components):
   - Dashboard pages
   - Settings pages
   - Auth pages
   - Root pages

## Notes

- All CSS variable system is already in place and working
- Glassmorphism effects are defined and ready to use
- Dark mode support is built into CSS variables
- Responsive utilities are available in ui-components.css
- No breaking changes to component APIs - props remain the same

