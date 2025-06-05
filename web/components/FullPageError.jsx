import { EmptyState } from '@shopify/polaris';

export function FullPageError({
  title,
  message,
}) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100%",
      width: "100%",
    }}>
      <EmptyState
        heading={title}
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>{message}</p>
      </EmptyState>
    </div>
  );
}
