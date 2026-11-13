export default function ViewEyeIcon({size=20}){
    return(
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} 
        viewBox="0 0 24 24">
            <path d="M0 0h24v24H0z" fill="none" />
            <g fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M21 12s-1-8-9-8s-9 8-9 8" />
            </g>
        </svg>
    )
}