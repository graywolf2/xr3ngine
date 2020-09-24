import { registerSystem } from "../../src/ecs/functions/SystemFunctions";
import { InputSystem } from "../../src/input/systems/InputSystem";
import { execute } from "../../src/ecs/functions/EngineFunctions";
import { addComponent, createEntity, removeEntity } from "../../src/ecs/functions/EntityFunctions";
import { Input } from "../../src/input/components/Input";
import { LocalInputReceiver } from "../../src/input/components/LocalInputReceiver";
import { InputSchema } from "../../src/input/interfaces/InputSchema";
import { BinaryValue } from "../../src/common/enums/BinaryValue";
import { DefaultInput } from "../../src/templates/shared/DefaultInput";
import { LifecycleValue } from "../../src/common/enums/LifecycleValue";
import { MouseInput } from "../../src/input/enums/MouseInput";
import { preventDefault } from "../../src/common/functions/preventDefault";
import { handleMouseMovement } from "../../src/input/behaviors/handleMouseMovement";
import { handleMouseButton } from "../../src/input/behaviors/handleMouseButton";
import { handleMouseWheel } from "../../src/input/behaviors/handleMouseWheel";
import { normalizeMouseCoordinates } from "../../src/common/functions/normalizeMouseCoordinates";

let addListenerMock:jest.SpyInstance;

const mockedBehaviorOnStarted = jest.fn(() => { console.log('behavior call on started') });
const mockedBehaviorOnEnded = jest.fn(() => { console.log('behavior call on ended') });
const mockedBehaviorOnChanged = jest.fn(() => { console.log('behavior call on changed') });

const testInputSchema: InputSchema = {
  inputRelationships: {},
  onAdded: [],
  onRemoved: [],

  eventBindings: {
    // Mouse
    contextmenu: [
      {
        behavior: preventDefault
      }
    ],
    mousemove: [
      {
        behavior: handleMouseMovement,
        args: {
          value: DefaultInput.SCREENXY
        }
      }
    ],
    mouseup: [
      {
        behavior: handleMouseButton,
        args: {
          value: BinaryValue.OFF
        }
      }
    ],
    mousedown: [
      {
        behavior: handleMouseButton,
        args: {
          value: BinaryValue.ON
        }
      }
    ],
    wheel: [
      {
        behavior: handleMouseWheel,
        args: {
          value: DefaultInput.CAMERA_SCROLL
        }
      }
    ],
  },
  // Map mouse buttons to abstract input
  mouseInputMap: {
    buttons: {
      [MouseInput.LeftButton]: DefaultInput.PRIMARY,
      [MouseInput.RightButton]: DefaultInput.SECONDARY,
      [MouseInput.MiddleButton]: DefaultInput.INTERACT
    },
    axes: {
      [MouseInput.MouseMovement]: DefaultInput.MOUSE_MOVEMENT,
      [MouseInput.MousePosition]: DefaultInput.SCREENXY,
      [MouseInput.MouseClickDownPosition]: DefaultInput.SCREENXY_START,
      [MouseInput.MouseClickDownTransformRotation]: DefaultInput.ROTATION_START,
      [MouseInput.MouseScroll]: DefaultInput.CAMERA_SCROLL
    }
  },
  inputButtonBehaviors: {
    [DefaultInput.PRIMARY]: {
      started: [
        {
          behavior: mockedBehaviorOnStarted
        }
      ],
      // mouse buttons can't be triggered continuously?
      // continued: []
      ended: [
        {
          behavior: mockedBehaviorOnEnded
        }
      ]
    },
  },
  inputAxisBehaviors: {
    [DefaultInput.SCREENXY]: {
      started: [
        {
          behavior: mockedBehaviorOnStarted
        }
      ],
      changed: [
        {
          behavior: mockedBehaviorOnChanged
        }
      ],
      // unchanged: [
      //   {
      //     behavior: mockedBehaviorOnStarted
      //   }
      // ]
    }
  },
}

let entity, input

beforeAll(() => {
  addListenerMock = jest.spyOn(document, 'addEventListener')
  registerSystem(InputSystem, { useWebXR: false });
})

beforeEach(() => {
  // in each test we should have new clean entity with new clean input component (unpolluted by previous tests)
  entity = createEntity()
  input = addComponent<Input>(entity, Input, { schema: testInputSchema }) as Input
  addComponent(entity, LocalInputReceiver)
  execute();

  mockedBehaviorOnStarted.mockClear()
  mockedBehaviorOnEnded.mockClear()
  mockedBehaviorOnChanged.mockClear()
})
afterEach(() => {
  // cleanup
  removeEntity(entity, true);
})

// buttons
describe("buttons", () => {
  const clickPoint1 = { x: 100, y:20 };
  const normalPoint1 = normalizeMouseCoordinates(clickPoint1.x, clickPoint1.y, window.innerWidth, window.innerHeight);

  it ("sets input ON, STARTED", () => {
    triggerMouse({ ...clickPoint1, button: MouseInput.LeftButton,  type: 'mousedown' })
    execute();

    expect(input.data.has(DefaultInput.PRIMARY)).toBeTruthy();
    const data1 = input.data.get(DefaultInput.PRIMARY);
    expect(data1.value).toBe(BinaryValue.ON);
    expect(data1.lifecycleState).toBe(LifecycleValue.STARTED);
  })

  it ("triggered started behavior", () => {
    triggerMouse({ ...clickPoint1, button: MouseInput.LeftButton,  type: 'mousedown' })
    execute();
    expect(mockedBehaviorOnStarted.mock.calls.length).toBe(1)
  })

  it ("sets input MouseClickDownPosition, DefaultInput.SCREENXY_START", () => {
    triggerMouse({ ...clickPoint1, button: MouseInput.LeftButton,  type: 'mousedown' })
    execute();
    expect(input.data.has(DefaultInput.SCREENXY_START)).toBeTruthy();
    const data1 = input.data.get(DefaultInput.SCREENXY_START);
    expect(data1.value).toMatchObject([ normalPoint1.x, normalPoint1.y ]);
    expect(data1.lifecycleState).toBe(LifecycleValue.STARTED);
  })

  it ("sets input OFF, ENDED", () => {
    triggerMouse({ ...clickPoint1, button: MouseInput.LeftButton,  type: 'mousedown' })
    execute();
    triggerMouse({ ...clickPoint1, button: MouseInput.LeftButton,  type: 'mouseup' })
    execute();

    expect(input.data.has(DefaultInput.PRIMARY)).toBeFalsy();
  })

  it ("triggered ended behavior", () => {
    triggerMouse({ ...clickPoint1, button: MouseInput.LeftButton,  type: 'mousedown' })
    execute();
    triggerMouse({ ...clickPoint1, button: MouseInput.LeftButton,  type: 'mouseup' })
    execute();
    expect(mockedBehaviorOnEnded.mock.calls.length).toBe(1)
  })
})

// move
// TODO: check MouseMovement
describe("movement", () => {
  const windowPoint1 = { x: 100, y:20 };
  const normalPoint1 = normalizeMouseCoordinates(windowPoint1.x, windowPoint1.y, window.innerWidth, window.innerHeight);
  const windowPoint2 = { x: 120, y:25 };
  const normalPoint2 = normalizeMouseCoordinates(windowPoint2.x, windowPoint2.y, window.innerWidth, window.innerHeight);

  it ("triggers associated input STARTED", () => {
    triggerMouse({ ...windowPoint1, type: 'mousemove' })
    execute();

    expect(input.data.has(DefaultInput.SCREENXY)).toBeTruthy();
    const data1 = input.data.get(DefaultInput.SCREENXY);
    expect(data1.value).toMatchObject([ normalPoint1.x, normalPoint1.y ]);
    expect(data1.lifecycleState).toBe(LifecycleValue.STARTED);
  })

  it ("triggered started behavior", () => {
    triggerMouse({ ...windowPoint1, type: 'mousemove' })
    execute();
    expect(mockedBehaviorOnStarted.mock.calls.length).toBe(1)
  })

  it ("triggers associated input CHANGED", () => {
    triggerMouse({ ...windowPoint1, type: 'mousemove' })
    execute();
    triggerMouse({...windowPoint2, type: 'mousemove'})
    execute();

    expect(input.data.has(DefaultInput.SCREENXY)).toBeTruthy();
    const data2 = input.data.get(DefaultInput.SCREENXY);
    expect(data2.value).toMatchObject([ normalPoint2.x, normalPoint2.y ]);
    expect(data2.lifecycleState).toBe(LifecycleValue.CHANGED);
  })

  it ("triggered changed behavior", () => {
    triggerMouse({ ...windowPoint1, type: 'mousemove' })
    execute();
    triggerMouse({...windowPoint2, type: 'mousemove'})
    execute();
    expect(mockedBehaviorOnChanged.mock.calls.length).toBe(1)
  })
})

// buttons + move
// TODO: check who's sets MouseInput.MouseClickDownTransformRotation - DefaultInput.ROTATION_START
// TODO: check that mousemove without button does not set MouseInput.MouseClickDownTransformRotation - DefaultInput.ROTATION_START
// test("move does not set DefaultInput.ROTATION_START", () => {
//
// })

// scroll
// TODO: check MouseScroll


function triggerMouse({ x, y, button, type}: { x:number, y:number, button?:number, type?:string }):void {
  const typeListenerCall = addListenerMock.mock.calls.find(call => call[0] === type)
  typeListenerCall[1]({
    type,
    target: document,
    button,
    clientX: x,
    clientY: y,
    view: window,
    cancelable: true,
    bubbles: true,
  })
}