type Props = {
  id: string;
  message?: string | null;
};

export default function AuthFieldError({ id, message }: Props) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs font-medium text-red-600 leading-snug">
      {message}
    </p>
  );
}
