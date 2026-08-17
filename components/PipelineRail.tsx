const STAGES = [
  { no: '01', name: 'Resolve', sub: 'PDOK / BAG' },
  { no: '02', name: 'Discover', sub: 'Bbl · DSO · local' },
  { no: '03', name: 'Normalize', sub: 'common rule schema' },
  { no: '04', name: 'Coverage', sub: 'verified · review · missing' },
  { no: '05', name: 'Serve', sub: 'clean API output' },
];

/**
 * `activeIndex` is -1 before a run, 0..4 while stages complete, 5 when done.
 */
export default function PipelineRail({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="rail">
      {STAGES.map((stage, i) => {
        const reached = activeIndex >= i;
        const current = activeIndex === i;
        return (
          <div
            key={stage.no}
            className={`stage${reached ? '' : ' dim'}${current ? ' active' : ''}`}
          >
            <div className="stage-no">{stage.no}</div>
            <h3 className="stage-name">{stage.name}</h3>
            <p className="stage-sub">{stage.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
