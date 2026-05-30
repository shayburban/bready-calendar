import { useToast } from "@/components/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  // `dismiss` is the same dispatch the auto-dismiss timer fires (see
  // use-toast.jsx). Wiring it to the X button gives the close icon its
  // missing onClick — previously <ToastClose /> rendered with zero props
  // so the button was inert.
  const { toasts, dismiss } = useToast();

  return (
    <ToastProvider>
      {toasts
        // The Toast/ToastClose primitives in this project are plain divs,
        // NOT Radix — they do not honor `open={false}` to hide themselves.
        // Without this filter a dismissed toast stays painted until
        // REMOVE_TOAST fires (200 ms later) AND it sits visually live for
        // those 200 ms. Filtering on `open !== false` makes both the
        // X-click and the 5s auto-dismiss feel instant.
        .filter((t) => t.open !== false)
        .map(function ({ id, title, description, action, ...props }) {
          return (
            // duration={5000} is defensive (Step 1 from the spec): plain
            // <div> ignores it, but if/when this file is migrated to real
            // Radix Toast primitives the countdown prop is already wired.
            <Toast key={id} duration={5000} {...props}>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose onClick={() => dismiss(id)} />
            </Toast>
          );
        })}
      <ToastViewport />
    </ToastProvider>
  );
} 