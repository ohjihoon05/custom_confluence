// Macro registry barrel — eager self-register.
//
// 새 매크로 추가 시 이 파일에 한 줄 import 추가하는 것이 정책.
//   예: import './button';
//
// 각 매크로 파일은 import 시점에 registerMacro(name, { opener })를 호출하여
// host/macro-registry에 자기 자신을 등록한다.
import './cards';
import './button';
