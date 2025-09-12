# stacked-router

A client side only, file based, router with path mapping to _"view component_ props. Treats opened views as a stack of cards. When a new view (route) is opened this view is added to the top of the stack. As long as enough screen estate is available for all open views they can be displayed side by side. If not the leftmost is hidden until on smaller screens only one view is visible.

The router maintains the browser history and navigation and include utilities to integrate with modern UI libraries navigation. The browser location always matches the focused view which allows links to individual views to be copied and shared.

## Basic idea

Allow placing multiple views side by side on large screens but still degrade gracefully on smaller screens (mobile). Mobile friendly should also be large desktop screen friendly.

Smaller screens/viewports stacks views on top of each other, hiding views that don't receive as much space as they want..

```text
..........
. ..........
. . ..........
. . . __________
. . . |        |
... . |        |
  ... |        |
    ..|        |
      ----------
```

Based on the minimum screen estate each view require, a larger screen/viewport could display more views if possible. Open views that do not receive enough screen estate will be hidden.

```text
..........
. ---------- ---------- ----------
. |        | |        | |        |
. |        | |        | |        |
. |        | |        | |        |
..|        | |        | |        |
  ---------- ---------- ----------
```
## Usage and concepts

**main.tsx**

```tsx
import { mapRoutes } from 'stacked-router'
import { RouterProvider } from 'stacked-router'

const modules = import.meta.glob('./views/**/*.tsx', { eager: true })
const config = mapRoutes(modules, './views')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider config={ config }>
      <App />
    </RouterProvider>
  </StrictMode>,
)

```

**App.tsx**

```tsx
import { StackedViewGroup } from 'stacked-router'

export function App() {
   return (
    <div ref={grid} className='w-screen h-screen relative'>
      <StackedViewGroup duration={0} className={`flex content-stretch h-screen overflow-hidden`} />
    </div>
  )
}
```

**_layout.tsx**

Layouts are optional and are automatically wrapped around all views at the same level or below it in the file tree. This layout handles active state and width css using tailwind.

```tsx
import { type PropsWithChildren } from 'react'
import { StackedView } from 'stacked-router'
import { useView } from 'stacked-router'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import View from '@/components/View'

export default function Layout({ children }: PropsWithChildren) {
  const { width, isActive } = useView()
  const stackedView = cva('h-full grow transition-all duration-10 group/view', {
    variants: {
      isActive: {
        true: 'is-active',
        false: 'border-s-1 border-s-foreground-300 [.is-active+&]:border-s-background'
      }
    }
  })

  return (
    <StackedView className={cn(stackedView({ isActive }))} style={{ flexBasis: `${width}vw` }}>
      <View.Root>
        {children}
      </View.Root>
    </StackedView>
  )
}
```

**users/[id].tsx**

File names with the structure `[param].tsx` automatically receives `param` in the url as props. As so the url `/users/10104` can be mapped to the below view component.

```tsx
function PlanningItem({ id }: { id: string }) {
  const user = useUser(id)

  return (
    <div>
      {user?.name ?? ''}
    </div>
  )
}
```

## Mapping file structure

Use RouterProvider to store all client side routes. Either through a config or by mapping a directory structure.

```tsx
import { mapRoutes } from 'stacked-router'
import { RouterProvider } from 'stacked-router'

const modules = import.meta.glob('./views/**/*.tsx', { eager: true })
const config = mapRoutes(modules, './views')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider config={ config }>
      <App />
    </RouterProvider>
  </StrictMode>,
)
```

**Example view file structure**

A simple file structure with one default view (`views/index.tsx`) and one global layout (`_layout.tsx`) file used for all views. The `plannings/` have one default view that lists plannings and one specific view that opens one planning.

All directories prefixed with underscore (`_`) are ignored. So view specific components are placed in `_component/` directories.

```
views/
    plannings/
        _components/
            Assignment.tsx
            AssigmentAction.tsx
        [id].tsx
        index.tsx
    _layout.tsx
    index.tsx
```

**Example view - `views/plannings/[id].tsx`**

```tsx
const meta = {
  breakpoints: [
    {
      breakpoint: 720,
      minVw: 50
    },
    {
      breakpoint: 1024,
      minVw: 30
    },
    {
      breakpoint: 1280,
      minVw: 20
    }
  ]
}

function PlanningItem({ id }: { id: string }) {
  return (
    <div>
      Planning item
    </div>
  )
}

PlanningItem.meta = meta
export default PlanningItem
```

The `mapRoutes()` creates a route configuration including minimum view width requirements for each breakpoint based on the meta data in each view file.

_The configuration includes the actual components which is not visible below, which is why the layout seems empty._

```json
{
  "routes": [
    {
      "path": "/",
      "meta": {
        "breakpoints": [
          {
            "breakpoint": 1024,
            "minVw": 50
          },
          {
            "breakpoint": 1280,
            "minVw": 33
          }
        ]
      }
    },
    {
      "path": "/plannings/[id]",
      "meta": {
        "breakpoints": [
          {
            "breakpoint": 720,
            "minVw": 50
          },
          {
            "breakpoint": 1024,
            "minVw": 30
          },
          {
            "breakpoint": 1280,
            "minVw": 20
          }
        ]
      }
    },
    {
      "path": "/plannings",
      "meta": {
        "breakpoints": [
          {
            "breakpoint": 1024,
            "minVw": 50
          },
          {
            "breakpoint": 1280,
            "minVw": 33
          }
        ]
      }
    }
  ],
  "layouts": {}
}
```

## Integrating with UI libraries

Stacked router, as most router libraries, expose hooks to allow better integration with (some) UI libraries that can be configured to use the router mechanism inside its UI components like tabs, listboxes, buttons etc. The hook `useNavigate()` handles client-side navigation and `useHref()` can translate router hrefs to native HTML hrefs. Example below is based on HeroUI.

```jsx
import { StackedViewGroup } from 'stacked-router'
import { useHref, useNavigate } from 'stacked-router/hooks'
import { HeroUIProvider } from '@heroui/react'

export function App() {
  const navigate = useNavigate()

   return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      <div ref={grid} className='w-screen h-screen relative'>
        <StackedViewGroup duration={0} className={`flex content-stretch h-screen overflow-hidden`} />
      </div>
    </HeroUIProvider>
  )
}
```

Then it is a simple matter of using the UI libraries components for navigation.

**Link component example**

```jsx
import { Link } from '@heroui/react'

<Link href='/plannings/234'>Planning item nr 234</Link>
```

**Dropdown menu example**

```jsx
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownSection, DropdownTrigger } from "@heroui/react";
import { Ellipsis } from 'lucide-react'

<Dropdown>
  <DropdownTrigger>
    <Button isIconOnly size="sm" variant="light">
      <Ellipsis size={18} />
    </Button>
  </DropdownTrigger>
  <DropdownMenu>
    <DropdownSection showDivider>
      <DropdownItem key='open' href={`/plannings/234`}>
        Planning item nr 234
      </DropdownItem>
    </DropdownSection>
  </DropdownMenu>
</Dropdown>
}
```

**shadcn example**

Integration with shadcn is different as it does not provide the same convenience context. Most shadcn components that need navigation (like Button, NavigationMenu) accept an `asChild` prop which makes it easy to wrap the stacked router `Link` component.

```jsx
import { Button } from '@/components/ui/button'
import { Link } from 'stacked-router'

<Button asChild>
  <Link to="/planning/234">Planning item nr 234</Link>
</Button>
```

## usNavigate()

For more custom ways of navigating to another view, the hook `useNavigate()`, can be used. It allows sending _invisible_ props.

```jsx
import { useNavigate } from 'stacked-router'

const navigate = useNavigate()

<button onPress={() => {
  navigate('/planning/234', {
    options: {
      fromEvent: '3433'
    }
  })
}}>
  Navigate to planning item nr 234
</button>
```

## useView()

Used to get query parameter, props or update query parameters or props.

```jsx
import { useView } from 'stacked-router'

const { props, setProps, queryParams, setQueryParams } = useView()

<button onPress={() => {
  // Add one prop
  setProps({ created: true})
}}>
  Is created
</button>

<button onPress={() => {
  // Set all (clear all) query parameters
  setQueryParams({}, true)
}}>
  Is created
</button>
```
