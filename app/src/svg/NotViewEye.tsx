export default function NotViewEyeIcon({size=20}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" 
    width={size} height={size} viewBox="0 0 24 24">
        <path d="M0 0h24v24H0z" fill="none" />
        <g fill="none" stroke="currentColor" 
        strokeLinecap="round" strokeWidth="1.5">
            <path d="M22 8s-4 6-10 6S2 8 2 8" />
            <path strokeLinejoin="round" 
            d="m15 13.5l1.5 2.5m3.5-5l2 2M2 13l2-2m5 2.5L7.5 16" />
        </g>
    </svg>
  )
}