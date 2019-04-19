resource "aws_ssm_parameter" "AUTHREQ_S3_BUCKET" {
  name  = "/fpw/AUTHREQ_S3_BUCKET"
  type  = "String"
  value = "forgotpw-authorized-requests-${var.environment}"
}
