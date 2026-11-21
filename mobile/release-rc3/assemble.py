"""Attach the author's verified public JAR signature to the matching CI bundle."""
from hashlib import sha256
from pathlib import Path
from zipfile import ZipFile
import sys

unsigned, signature, output = map(Path, sys.argv[1:])
if sha256(unsigned.read_bytes()).hexdigest() != "899564bbb77aab024c5f2fa581df2feef0a94de4d72a6089803b32afad492b93":
    raise ValueError("Unsigned bundle does not match the signed build")
with ZipFile(output, "w") as dest:
    for source in (signature, unsigned):
        with ZipFile(source) as archive:
            for item in archive.infolist():
                dest.writestr(item, archive.read(item))
if sha256(output.read_bytes()).hexdigest() != "dbea26e4b89fd1ea98364bf7a0ef8bd9a17bd1c6aa6fd5ae41641c2ee19e47a9":
    raise ValueError("Signed package digest mismatch")
