# 0.45 -> 0.46 Options format

Now element takes 16 bytes instead 24

## Release schema
```
u64 data   : 44;
u64 type   :  4;
u64 count  : 16;
u64 id     : 48;
u64 id_crc : 16;
```

## Test schema
```
u64 data  : 44;
u64 type  :  4;
u64 count : 16;
u64 id    : 44;
u64 id_crc: 20;
```

## Old, 0.45 schema
```
pcvoid   data; // 64-bit pointer
pcstr    id;   // 64-bit pointer
u32      id_crc;
u16      type;
u16      count;
```
