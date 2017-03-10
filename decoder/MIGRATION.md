в 0.46 поменялся формат конфигов
раньше элемент занимал 24 байта, теперь 16
u64 data  : 44;
u64 type  :  4;
u64 count : 16;
u64 id    : 44;
u64 id_crc: 20;

текущая схема:
pcvoid   data; // 64-bit pointer
pcstr    id;   // 64-bit pointer
u32      id_crc;
u16      type;
u16      count;

Старый формат будет еще в версиях c2, a0, a1
