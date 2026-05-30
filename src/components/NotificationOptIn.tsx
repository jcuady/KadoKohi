import NotificationToggle from './NotificationToggle';

/** @deprecated Use NotificationToggle instead. Kept for backward compatibility. */
export default function NotificationOptIn(props: {
  variant?: 'card' | 'pill';
  label?: string;
}) {
  if (props.variant === 'pill') {
    return (
      <NotificationToggle
        variant="sidebar"
        audience="customer"
        label={props.label ?? 'Alerts'}
      />
    );
  }
  return (
    <NotificationToggle
      variant="profile"
      audience="customer"
      label={props.label ?? 'Push notifications'}
    />
  );
}
