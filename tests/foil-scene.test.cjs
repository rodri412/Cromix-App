const test=require('node:test');
const assert=require('node:assert/strict');
const {foilCameraDistance,emergingRecordPose,foilTearLift}=require('../src/domain/foilScene.ts');

test('emerging discs and cassettes fit completely throughout their flight on narrow and wide screens',()=>{
  for(const [format,halfWidth,halfHeight] of [['CD',1.54,1.54],['VINILO',1.54,1.54],['CASETE',1.65,1.15],['MINIDISC',1.28,1.36]]) {
    for(const aspect of [0.5,260/340,1.4])for(let frame=0;frame<=100;frame++) {
      const progress=frame/100,pose=emergingRecordPose(progress);
      const distance=foilCameraDistance(progress,format,aspect)-pose.z-0.25;
      const halfViewHeight=distance*Math.tan(42*Math.PI/360);
      assert.ok(halfWidth*pose.scale<halfViewHeight*aspect,`${format}: horizontal clipping at ${progress}`);
      assert.ok(Math.abs(pose.y)+halfHeight*pose.scale<halfViewHeight,`${format}: vertical clipping at ${progress}`);
    }
  }
});
test('the top strip separates only behind the tear and detaches entirely when complete',()=>{
  assert.equal(foilTearLift(-1.05,0,1),0);
  assert.equal(foilTearLift(-1.05,0.5,1),1);
  assert.equal(foilTearLift(0.8,0.5,1),0);
  for(const direction of [1,-1])for(const x of [-1.05,0,1.05])assert.equal(foilTearLift(x,1,direction),1);
  assert.equal(foilTearLift(-0.8,0.5,1),foilTearLift(0.8,0.5,-1));
});
