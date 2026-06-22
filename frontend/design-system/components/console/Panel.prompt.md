Titled white card — the workhorse container for console screen sections.

```jsx
<Panel title="热销商品" subtitle="按销量排序 Top 10"
  actions={<Button variant="neutral" size="sm">导出</Button>}>
  <DataTable columns={cols} rows={rows} />
</Panel>
```

Props: `title`, `subtitle`, `actions` (right of header), `padded` (false for flush tables). Header is omitted entirely when there's no `title`/`actions`.
