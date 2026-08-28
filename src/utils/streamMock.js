export class Readable {}
export class Writable {}
export class Transform {}
export class Duplex {}

const streamMock = {
  Readable,
  Writable,
  Transform,
  Duplex,
};

export default streamMock;
