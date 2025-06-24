//org_id is not showing up that's why making a custom type to ignore build errors
type CustomClaims = {
  o?: {
    id?:string;
  };
}

export default CustomClaims