 starting offset is 0x508

 ---
 each entry is 24 bytes long, the last 4 bytes (entry+20) points to an offset in the file with its proper string. entry+12 contains the entry value

 ---

 entries with value type 3/4 means the variable 'value' contains an id of another entry. this other entry will have a string (and probably sub-entries) if 'value type' was 3, or no string if it was 4

 ---

 suggestion for your tool: since entries with type 4 points to sub-entries without strings, how about you give those sub-entries the same string than the initial entry plus a number suffix? eg:
- weapon_affinities
+- weapon_affinities0
+- weapon_affinities1
+- weapon_affinities2

---

i was reading entries from the wrong offset. actually, there is no header, all entries are 24 bytes from the start of the file:
int32 value
int32 value 64bits part?
int32 string offset
int32 string offset 64bits part?
int32 unknown id
int16 value type
int16 value size

---
i found all value types:
0 boolean
1 int32
2 float
3 entry id
4 entry id
5 string

the 2nd int16 is the amount of entries if the 1st int16 is 3 or 4. for strings its the string size + null terminator. for the rest its sizeof.int32

2nd int16 variable is the: size of value / amount of entries / size of string

---
You were right in that the 16-bit section was the type, its just that we were sampling the wrong area; getting the type of the previous entry instead?

01 00 = Int, 02 00 = Float.

---

the .exe has a if ((short)entry+20 == 2) check so i found the correct structure. i also found this:

id = *(_DWORD *)entry + 24 * *(_WORD *)(entry + 22);

so the last int16 is about an entries id which is maybe a linked entry id

2 = float, rest = int32

i think for now the best way to get the correct amount of entries is to keep reading till the 'parameters' string
